import Hls from "hls.js";
import { lngLatToMercator, createSprite } from "./mapUtils";
import { API } from "@/api";
import { reactive, nextTick } from "vue";

/**
 * 摄像头地图组件
 * 负责在地图上绘制摄像头、处理摄像头点击事件和视频播放
 */

// 常量定义
const CAMERA_WIDTH = 100;
const CAMERA_HEIGHT = 100;
const CAMERA_ZINDEX_START = 9999;
const CAMERA_CONTAINER_PREFIX = "";
const VIDEO_AUTO_PLAY_DELAY = 100;
const CAMERA_TEXTURE_NAME = "camera";

/**
 * 创建独立状态的摄像头函数
 * @returns {Object} 摄像头状态对象
 * @returns {Array} returns.CameraLstPIXI - 地图上的摄像头精灵实例列表
 * @returns {Array} returns.showCameraLst - 显示中的摄像头视频列表
 */
export function createCameraLstState() {
  return {
    CameraLstPIXI: reactive([]), // 地图上的摄像头精灵实例列表
    showCameraLst: reactive([]), // 显示中的摄像头视频列表
  };
}

/**
 * 绘制摄像头到地图上
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Array} cameraLst - 摄像头数据列表
 * @param {Object} mapInfo - 地图信息
 * @param {Object} originScale - 原始缩放比例
 * @param {Object} scale - 当前缩放比例
 * @param {Object} DialogData - 对话框数据
 * @param {Object} Map - 地图实例
 * @param {Object} props - 组件属性
 * @param {Object} cameraLstState - 摄像头状态
 */
export function drawCamera(
  mapContainer,
  cameraLst,
  mapInfo,
  originScale,
  scale,
  DialogData,
  Map,
  props,
  cameraLstState
) {
  // 检查是否应该绘制摄像头
  if (!props.ShouldDrawCamera) {
    console.log("未启用摄像头绘制");
    // 即使不绘制，也要销毁旧的摄像头实例
    destroyAllCameras(cameraLstState);
    return;
  }

  // 获取摄像头数据（统一处理不同来源的数据）
  const cameraData = getCameraData(cameraLst, mapInfo);

  // 验证资源是否存在，不存在则尝试加载
  let cameraResource = PIXI.Loader.shared.resources[CAMERA_TEXTURE_NAME];
  if (!cameraData || cameraData.length === 0) {
    console.log("没有摄像头数据可绘制");
    // 没有数据时，销毁旧的摄像头实例
    destroyAllCameras(cameraLstState);
    return;
  }

  if (!cameraResource || !cameraResource.texture) {
    console.warn("摄像头纹理资源未找到，尝试重新加载");
    
    const loader = PIXI.Loader.shared;
    const cameraTexturePath = "images/PPMS/IntergratedManagementDashboard/camera.png";
    
    // 检查资源是否已添加到加载器（避免重复添加）
    const isResourceAdded = Object.keys(loader.resources).includes(CAMERA_TEXTURE_NAME) || 
                          (loader._resources && Object.keys(loader._resources).includes(CAMERA_TEXTURE_NAME));
    
    if (!isResourceAdded) {
      console.log("添加摄像头纹理资源到加载器");
      // 添加资源到加载器
      loader.add(CAMERA_TEXTURE_NAME, cameraTexturePath);
    }
    
    // 开始加载资源（无论是否已添加）
    console.log("开始加载摄像头纹理资源");
    // 使用 load 方法的回调函数，确保资源加载完成后重新绘制
    loader.load((loader, resources) => {
      console.log("摄像头纹理资源加载完成");
      // 资源加载完成后重新绘制
      drawCamera(mapContainer, cameraLst, mapInfo, originScale, scale, DialogData, Map, props, cameraLstState);
    });
    return;
  }
  
  const texture = cameraResource.texture;

  // 销毁现有摄像头实例
  destroyAllCameras(cameraLstState);

  cameraData.forEach((camera, index) => {
    try {
      // 创建摄像头精灵并添加到容器
      const cameraSprite = createCameraSprite(
        camera,
        texture,
        originScale,
        scale,
        mapInfo,
        DialogData,
        props,
        cameraLstState
      );
      mapContainer.addChild(cameraSprite);
      cameraLstState.CameraLstPIXI.push(cameraSprite);
    } catch (error) {
      console.error(`绘制摄像头 ${index} 失败:`, error);
    }
  });
  Map.render();
}

/**
 * 获取摄像头数据（统一处理不同来源的数据）
 * @param {Array} cameraLst - 摄像头数据列表
 * @param {Object} mapInfo - 地图信息
 * @returns {Array} 统一格式的摄像头数据列表
 */
const getCameraData = (cameraLst, mapInfo) => {
  if (cameraLst && cameraLst.length) {
    return cameraLst;
  }

  // 从图层信息中提取摄像头数据
  if (mapInfo.LayerInfos && Array.isArray(mapInfo.LayerInfos)) {
    return mapInfo.LayerInfos.map((layer) => {
      const cameraElements = (layer.Elements || []).filter(
        (element) => element.Type === "Camera"
      );

      // 统一数据格式
      return cameraElements.map((item) => ({
        ...item,
        id: item.ExtendInfo?.CameraID,
        CameraName: item.ExtendInfo?.CameraName,
      }));
    })
      .flat()
      .filter(Boolean); // 过滤无效数据
  }

  return [];
};

/**
 * 创建摄像头精灵
 * @param {Object} camera - 摄像头数据
 * @param {PIXI.Texture} texture - 摄像头纹理
 * @param {Object} originScale - 原始缩放比例
 * @param {Object} scale - 当前缩放比例
 * @param {Object} mapInfo - 地图信息
 * @param {Object} DialogData - 对话框数据
 * @param {Object} props - 组件属性
 * @param {Object} cameraLstState - 摄像头状态
 * @returns {PIXI.Sprite} 摄像头精灵实例
 */
const createCameraSprite = (
  camera,
  texture,
  originScale,
  scale,
  mapInfo,
  DialogData,
  props,
  cameraLstState
) => {
  // 准备createSprite方法所需的数据格式
  const spriteItem = {
    ...camera,
    // 确保包含createSprite方法所需的属性
    ImageID: CAMERA_TEXTURE_NAME,
    Length: CAMERA_WIDTH,
    Width: CAMERA_HEIGHT,
    CenterY: camera.CenterY || camera.Latitude ||camera.MapPoints[0].Y,
    CenterX: camera.CenterX || camera.Longitude||camera.MapPoints[0].X,
    Mirror: false,
    Angle: camera.Angle || 0,
    RefObjectID: camera.id || camera.RefObjectID,
    Name: camera.CameraName || camera.Name
  };
  // 创建临时resources对象
  const resources = {
    [CAMERA_TEXTURE_NAME]: { texture }
  };

  // 使用mapUtils.js中的createSprite方法创建精灵
  const iconSprite = createSprite(spriteItem, resources, mapInfo);

  // 调整精灵的缩放比例，以适应camera.js中的需求
  iconSprite.scale.set(originScale.value / 2 / scale.value);

  // 如果有MapPoints，覆盖位置
  if (camera.MapPoints && camera.MapPoints[0]) {
    iconSprite.x = camera.MapPoints[0].X;
    iconSprite.y = camera.MapPoints[0].Y;
  }

  // 绑定点击事件
  if (props.Clickable) {
    iconSprite.on("pointerdown", (event) =>
      handleCameraClick(event, camera, DialogData, cameraLstState)
    );
  }

  return iconSprite;
};

/**
 * 计算摄像头位置
 * @param {Object} camera - 摄像头数据
 * @param {Object} mapInfo - 地图信息
 * @returns {Object} 摄像头位置坐标
 * @returns {number} returns.x - 横坐标
 * @returns {number} returns.y - 纵坐标
 */
const getCameraPosition = (camera, mapInfo) => {
  // 如果有MapPoints直接使用
  if (camera.MapPoints && camera.MapPoints[0]) {
    return {
      x: camera.MapPoints[0].X,
      y: camera.MapPoints[0].Y,
    };
  }

  // 否则通过经纬度计算
  const [mercatorX, mercatorY] = lngLatToMercator(
    Number(camera.CenterY),
    Number(camera.CenterX)
  );

  return {
    x: mercatorX - (mapInfo.Origin?.X || 0),
    y: -(mercatorY + (mapInfo.Origin?.Y || 0)),
  };
};

/**
 * 处理摄像头点击事件
 * @param {Object} event - 点击事件对象
 * @param {Object} camera - 摄像头数据
 * @param {Object} DialogData - 对话框数据
 * @param {Object} cameraLstState - 摄像头状态
 */
const handleCameraClick = (event, camera, DialogData, cameraLstState) => {
  // 检查是否已在显示列表中
  const existingCamera = cameraLstState.showCameraLst.find(
    (item) => item.CameraName === camera.CameraName
  );

  if (existingCamera) {
    // 如果已存在，显示它
    existingCamera.show = true;
    if (camera.IPAddress) {
      initCameraVideo(camera, cameraLstState);
    }
    return;
  }

  // 新摄像头，获取预览URL
  API.QueryMapCameraViewUrl({ CameraID: camera.id }, (res) => {
    const previewUrl = res.data?.PreViewUrl;
    if (!previewUrl) {
      console.error("获取摄像头预览URL失败");
      return;
    }

    camera.IPAddress = previewUrl;

    // 添加到显示列表
    cameraLstState.showCameraLst.push({
      zIndex: cameraLstState.showCameraLst.length + CAMERA_ZINDEX_START,
      id: camera.CameraName,
      CameraName: camera.CameraName,
      IPAddress: previewUrl,
      width: 370,
      left: getCameraPositionLeft(event, DialogData),
      top: getCameraPositionTop(event, DialogData),
      show: true,
    });

    // 初始化视频播放
    initCameraVideo(camera, cameraLstState);
  });
};

/**
 * 计算摄像头弹窗左侧位置
 * @param {Object} event - 点击事件对象
 * @param {Object} DialogData - 对话框数据
 * @returns {number} 弹窗左侧位置
 */
const getCameraPositionLeft = (event, DialogData) => {
  if (event.data.global.x) {
    return (event.data.global.x || 0) + 20;
  }
  if (event.data.originalEvent?.clientX) {
    return event.data.originalEvent.clientX / (DialogData.zoomX || 1);
  }
  return 0;
};

/**
 * 计算摄像头弹窗顶部位置
 * @param {Object} event - 点击事件对象
 * @param {Object} DialogData - 对话框数据
 * @returns {number} 弹窗顶部位置
 */
const getCameraPositionTop = (event, DialogData) => {
  if (event.data.global.y?.clientY) {
    return (event.data.global.y || 0) + 150;
  }
  if (event.data.originalEvent?.clientY) {
    return event.data.originalEvent.clientY / (DialogData.zoomY || 1) - 100;
  }
  return 0;
};

/**
 * 初始化摄像头视频播放
 * @param {Object} camera - 摄像头数据
 * @param {Object} cameraLstState - 摄像头状态
 */
const initCameraVideo = (camera, cameraLstState) => {
  // 延迟执行，确保DOM已更新
  nextTick(() => {
    try {
      // 检查HLS支持
      if (!Hls || !Hls.isSupported()) {
        console.warn("浏览器不支持HLS视频播放");
        return;
      }

      // 检查视频元素是否已存在
      if (document.getElementById(camera.CameraName)) {
        return;
      }

      // 找到容器元素
      const index = cameraLstState.showCameraLst.findIndex(
        (item) => item.id === camera.CameraName
      );
      const containerId = `${CAMERA_CONTAINER_PREFIX}${camera.CameraName}${index}`;
      const container = document.getElementById(containerId);

      if (!container) {
        console.error(`摄像头容器元素 ${containerId} 未找到`);
        return;
      }

      // 创建视频元素
      const videoElement = createVideoElement(camera.CameraName);
      container.appendChild(videoElement);

      // 初始化HLS播放
      const hls = new Hls();
      hls.loadSource(camera.IPAddress);
      hls.attachMedia(videoElement);

      // 视频就绪后播放
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.play().catch((error) => {
          console.warn("视频自动播放失败（可能被浏览器阻止）:", error);
        });
      });
    } catch (error) {
      console.error("初始化摄像头视频失败:", error);
    }
  }, VIDEO_AUTO_PLAY_DELAY);
};

/**
 * 创建视频元素
 * @param {string} cameraName - 摄像头名称
 * @returns {HTMLVideoElement} 视频元素
 */
const createVideoElement = (cameraName) => {
  const videoElement = document.createElement("video");
  videoElement.setAttribute("id", cameraName);
  videoElement.setAttribute("class", "video-js");
  videoElement.setAttribute("style", "width: 100%; height: auto");
  videoElement.setAttribute("muted", "true");
  videoElement.setAttribute("controls", "true");
  return videoElement;
};

/**
 * 销毁所有摄像头实例
 * @param {Object} cameraLstState - 摄像头状态
 */
const destroyAllCameras = (cameraLstState) => {
  if (cameraLstState.CameraLstPIXI && cameraLstState.CameraLstPIXI.length) {
    cameraLstState.CameraLstPIXI.forEach((item) => {
      if (item && typeof item.destroy === 'function') {
        item.destroy();
      }
    });
    cameraLstState.CameraLstPIXI = [];
  }
};