import {
  lngLatToMercator,
  fitPathToView,
  calculatePathLength,
  getPointAtDistance,
  calculateBounds,
  processPolygonVertices,
  createPolygonGraphic,
  createSprite,
} from "./mapUtils";
import { reactive } from "vue";
// import { parseGIF, decompressFrames } from 'gifuct-js';

/**
 * 创建独立的精灵状态管理对象
 * @returns {Object} 精灵状态对象，包含各种精灵的数组
 * @property {Array} PBSs - PBS（泊位）精灵数组
 * @property {Array} carSprites - 车辆位置精灵数组
 * @property {Array} routerObjs - 路径精灵数组
 * @property {Array} spritesList - 船体图片精灵数组
 * @property {Array} imgLst - 图片列表
 * @property {Array} materials - 物资精灵数组
 */
export function createSpriteState() {
  return {
    PBSs: reactive([]),
    carSprites: reactive([]),
    routerObjs: reactive([]),
    spritesList: reactive([]),
    imgLst: [],
    materials: reactive([]),
  };
}
//PBSs实例

// 常量定义 - 集中管理配置和样式
const SPRITE_CONFIG = {
  CAR: {
    WIDTH: 50,
    HEIGHT: 20,
    TEXT_STYLE: {
      fontSize: 50,
      backgroundColor: "#fff",
    },
    TEXT_OFFSET: {
      NAME: 15,
      NO: 22,
    },
    TEXT_SCALE: 0.1,
  },
  ROUTER: {
    PATH_STYLE: {
      width: 4,
      color: 0x1500ff,
      alpha: 1,
    },
    ARROW: {
      WIDTH: 3,
      HEIGHT: 3,
      INTERVAL: 5,
    },
    CAR: {
      WIDTH: 10,
      HEIGHT: 8,
    },
    POINT: {
      RADIUS: 5,
      START_COLOR: 0x4caf50, // 绿色起点
      END_COLOR: 0xf44336, // 红色终点
    },
  },
  ANIMATION: {
    SPEED: 0.002,
  },
  IMAGE_TYPE_MAP: {
    0: "svg",
    1: "png",
    2: "jpg",
  },
  SHIP: {
    POSITION_SPRITE: {
      WIDTH: 85,
      HEIGHT: 90,
      X_OFFSET: 7,
      Y_OFFSET: -30,
    },
    LABEL: {
      FONT_SIZE: 15,
      BACKGROUND_COLOR: "#fff",
      FILL: 0xffffff,
      X_OFFSET: 1,
      Y_OFFSET: -65,
    },
  },
  HOVER_EFFECT: {
    JUMP_HEIGHT: 10,
    JUMP_DURATION: 1500,
    Z_INDEX_TOP: 9999,
  },
  MATERIAL: {
    DEFAULT_IMAGE_TYPE: "png",
  },
  GRID_TEXTURE: {
    GRID_SIZE: 2,
    TEXTURE_SIZE: 400,
  },
};

/**
 * 生成车辆位置图标
 * @param {Object} props - 包含车辆列表数据的属性对象
 * @param {Object} mapInfo - 地图信息对象
 * @param {Object} MapConfigParams - 地图配置参数
 * @param {Object} angle - 角度对象，包含value属性表示当前角度
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Object} Map - 地图对象，包含render方法
 * @param {Object} spriteState - 精灵状态管理对象
 */
export function drawCarSprites(
  props,
  mapInfo,
  MapConfigParams,
  angle,
  mapContainer,
  Map,
  spriteState
) {
  // 清空现有精灵
  clearSprites(spriteState.carSprites);

  // 验证数据
  if (
    !props?.CarLst ||
    !Array.isArray(props.CarLst) ||
    props.CarLst.length === 0
  ) {
    return;
  }

  // 转换坐标并创建车辆精灵
  const points = props.CarLst.map(
    convertCarPointToMapCoords(mapInfo, MapConfigParams)
  );

  points.forEach((point) => {
    // 创建车辆精灵
    const carSprite = createCarSprite(point, angle.value);
    spriteState.carSprites.push(carSprite);
    mapContainer.addChild(carSprite);

    // 创建车辆文本标签
    const { text1, text2 } = createCarLabels(point, angle.value);
    spriteState.carSprites.push(text1, text2);
    mapContainer.addChild(text1, text2);
  });

  Map.render();
}

// 公共辅助函数 - 坐标转换

/**
 * 将经纬度坐标转换为地图像素坐标
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {Object} mapInfo - 地图信息对象
 * @param {Object} [offset] - 偏移量
 * @returns {Array} [x, y] - 地图像素坐标
 */
const convertLngLatToMapPixel = (lng, lat, mapInfo, offset = {}) => {
  const picCenter = lngLatToMercator(lat, lng);
  const x = picCenter[0] - mapInfo.Origin?.X + (offset.x || 0);
  const y = -(picCenter[1] + mapInfo.Origin?.Y + (offset.y || 0));
  return [x, y];
};

// 转换车辆坐标到地图坐标
const convertCarPointToMapCoords = (mapInfo, MapConfigParams) => (it) => {
  const [x, y] = convertLngLatToMapPixel(
    Number(it.x),
    Number(it.y),
    mapInfo,
    {
      x: MapConfigParams?.routerOffsetX || 0,
      y: MapConfigParams?.routerOffsetY || 0
    }
  );
  
  return {
    Name: it.Name,
    No: it.No,
    x,
    y,
  };
};

// 创建车辆精灵
const createCarSprite = (point, angle) => {
  const texture = PIXI.Loader.shared.resources["pingbanchece"].texture;
  const carSprite = new PIXI.Sprite(texture);

  carSprite.anchor.set(0.5, 0.5);
  carSprite.width = SPRITE_CONFIG.CAR.WIDTH;
  carSprite.height = SPRITE_CONFIG.CAR.HEIGHT;
  carSprite.x = point.x;
  carSprite.y = point.y;
  carSprite.angle = angle;

  return carSprite;
};

// 创建车辆文本标签
const createCarLabels = (point, angle) => {
  const text1 = new PIXI.Text(point.Name, SPRITE_CONFIG.CAR.TEXT_STYLE);
  const text2 = new PIXI.Text(point.No, SPRITE_CONFIG.CAR.TEXT_STYLE);

  [text1, text2].forEach((text) => {
    text.anchor.set(0.5, 0.5);
    text.angle = angle;
    text.scale.set(SPRITE_CONFIG.CAR.TEXT_SCALE);
    text.x = point.x;
  });

  text1.y = point.y + SPRITE_CONFIG.CAR.TEXT_OFFSET.NAME;
  text2.y = point.y + SPRITE_CONFIG.CAR.TEXT_OFFSET.NO;

  return { text1, text2 };
};

/**
 * 添加路径箭头图标及动画
 * @param {Object} props - 包含路径数据的属性对象
 * @param {Object} mapInfo - 地图信息对象
 * @param {Object} MapConfigParams - 地图配置参数
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {number} scale - 地图缩放比例
 * @param {Object} Map - 地图对象，包含render方法
 * @param {Function} resetMap - 重置地图的函数
 * @param {Object} spriteState - 精灵状态管理对象
 */
export function drawRouterSprites(
  props,
  mapInfo,
  MapConfigParams,
  mapContainer,
  scale,
  Map,
  resetMap,
  spriteState
) {
  // 清空现有路由对象
  clearSprites(spriteState.routerObjs);
  resetMap();

  // 验证路径数据
  if (
    !props?.router ||
    !Array.isArray(props.router) ||
    props.router.length === 0
  ) {
    return;
  }

  // 转换路径坐标
  const points = props.router.map(
    convertRouterPointToMapCoords(mapInfo, MapConfigParams)
  );

  // 生成箭头路径点
  const arrowPathLst = generateArrowPathLst(
    points,
    SPRITE_CONFIG.ROUTER.ARROW.INTERVAL
  );

  // 创建路径图形
  const path = createRouterPath(points);
  spriteState.routerObjs.push(path);
  mapContainer.addChild(path);

  // 创建箭头精灵
  createArrowSprites(arrowPathLst, mapContainer, spriteState);

  // 创建车辆精灵
  const carSprite = createRouterCarSprite();
  spriteState.routerObjs.push(carSprite);
  mapContainer.addChild(carSprite);

  // 创建起点和终点标记
  const { startPoint, endPoint } = createRoutePoints(points);
  spriteState.routerObjs.push(startPoint, endPoint);
  mapContainer.addChild(startPoint, endPoint);

  // 适配路径到视图
  fitPathToView(MapConfigParams, mapInfo, mapContainer, scale, props.router);

  // 启动箭头动画
  startArrowAnimation(carSprite, arrowPathLst, Map);
}

// 转换路由点坐标到地图坐标
const convertRouterPointToMapCoords = (mapInfo, MapConfigParams) => (it) => {
  const [lat, lng] = it.split(",").map(Number);
  const [x, y] = convertLngLatToMapPixel(
    lng,
    lat,
    mapInfo,
    {
      x: MapConfigParams?.routerOffsetX || 0,
      y: MapConfigParams?.routerOffsetY || 0
    }
  );

  return {
    x,
    y,
  };
};

// 创建路由路径
const createRouterPath = (points) => {
  const path = new PIXI.Graphics();
  const { width, color, alpha } = SPRITE_CONFIG.ROUTER.PATH_STYLE;

  path.lineStyle(width, color, alpha);
  path.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    path.lineTo(points[i].x, points[i].y);
  }

  return path;
};

// 创建箭头精灵
const createArrowSprites = (arrowPathLst, mapContainer, spriteState) => {
  const texture = PIXI.Loader.shared.resources["blueArrow"].texture;

  arrowPathLst.forEach((it, index) => {
    if (index % 5 === 0) {
      const arrowSprite = new PIXI.Sprite(texture);
      arrowSprite.anchor.set(0.5, 0.5);
      arrowSprite.width = SPRITE_CONFIG.ROUTER.ARROW.WIDTH;
      arrowSprite.height = SPRITE_CONFIG.ROUTER.ARROW.HEIGHT;
      arrowSprite.x = it.x;
      arrowSprite.y = it.y;

      // 设置箭头方向
      if (index < arrowPathLst.length - 1) {
        const nextPoint = arrowPathLst[index + 1];
        const dx = nextPoint.x - it.x;
        const dy = nextPoint.y - it.y;
        arrowSprite.rotation = Math.atan2(dy, dx) + Math.PI / 2;
      }

      spriteState.routerObjs.push(arrowSprite);
      mapContainer.addChild(arrowSprite);
    }
  });
};

// 创建路由上的车辆精灵
const createRouterCarSprite = () => {
  const texture = PIXI.Loader.shared.resources["pingbanche"].texture;
  const carSprite = new PIXI.Sprite(texture);

  carSprite.anchor.set(0.5, 0.5);
  carSprite.scale.x = -1;
  carSprite.width = SPRITE_CONFIG.ROUTER.CAR.WIDTH;
  carSprite.height = SPRITE_CONFIG.ROUTER.CAR.HEIGHT;

  return carSprite;
};

// 创建起点和终点标记
const createRoutePoints = (points) => {
  // 起点
  const startPoint = new PIXI.Graphics();
  startPoint.beginFill(SPRITE_CONFIG.ROUTER.POINT.START_COLOR);
  startPoint.drawCircle(0, 0, SPRITE_CONFIG.ROUTER.POINT.RADIUS);
  startPoint.endFill();
  startPoint.position.set(points[0].x, points[0].y);

  // 终点
  const endPoint = new PIXI.Graphics();
  endPoint.beginFill(SPRITE_CONFIG.ROUTER.POINT.END_COLOR);
  endPoint.drawCircle(0, 0, SPRITE_CONFIG.ROUTER.POINT.RADIUS);
  endPoint.endFill();
  endPoint.position.set(
    points[points.length - 1].x,
    points[points.length - 1].y
  );

  return { startPoint, endPoint };
};

// 生成箭头坐标列表
const generateArrowPathLst = (path, interval = 5) => {
  const pathLst = [];

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];

    // 计算线段长度
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 确保至少有一个点
    const steps = Math.max(1, Math.floor(distance / interval));

    // 生成线段上的点
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      pathLst.push({
        x: start.x + t * dx,
        y: start.y + t * dy,
      });
    }
  }

  return pathLst;
};

// 动画控制器
const animationController = {
  isRunning: false,
  animationId: null,
  progress: 0,
  speed: SPRITE_CONFIG.ANIMATION.SPEED,
};

// 启动箭头动画
const startArrowAnimation = (sprite, pathPoints, Map) => {
  // 停止现有动画
  stopAnimation();

  // 初始化动画状态
  animationController.isRunning = true;
  animationController.progress = 0;

  // 计算路径总长度
  const totalDistance = calculatePathLength(pathPoints);

  // 动画函数
  const animate = () => {
    if (!animationController.isRunning || !sprite || !Map || !Map.render) {
      stopAnimation();
      return;
    }

    // 更新进度
    animationController.progress += animationController.speed;
    if (animationController.progress >= 1) {
      animationController.progress = 0;
    }

    // 更新位置
    const currentDistance = animationController.progress * totalDistance;
    const currentPoint = getPointAtDistance(pathPoints, currentDistance);

    if (currentPoint && sprite && sprite.x !== undefined && sprite.y !== undefined) {
      sprite.x = currentPoint.x;
      sprite.y = currentPoint.y;

      // 更新方向
      const nextDistance = Math.min(currentDistance + 10, totalDistance);
      const nextPoint = getPointAtDistance(pathPoints, nextDistance);

      if (nextPoint) {
        const angle = Math.atan2(
          nextPoint.y - currentPoint.y,
          nextPoint.x - currentPoint.x
        );
        if (sprite.rotation !== undefined) {
          sprite.rotation = angle;
        }
      }
    }

    try {
      Map.render();
      animationController.animationId = requestAnimationFrame(animate);
    } catch (e) {
      stopAnimation();
      console.warn('动画渲染失败，已停止', e);
    }
  };

  // 启动动画
  animationController.animationId = requestAnimationFrame(animate);
};

// 停止动画
const stopAnimation = () => {
  if (animationController.animationId) {
    cancelAnimationFrame(animationController.animationId);
    animationController.isRunning = false;
    animationController.animationId = null;
  }
};

// 导出stopAnimation函数供外部调用
export { stopAnimation };

/**
 * 绘制船体图片精灵
 * @param {Object} props - 包含船体位置和图片数据的属性对象
 * @param {Object} mapInfo - 地图信息对象
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Object} Map - 地图对象，包含render方法
 * @param {Function} shipSpritesOnClick - 船体点击事件处理函数
 * @param {Function} departmentSpritesOnClick - 部门点击事件处理函数
 * @param {Object} spriteState - 精灵状态管理对象
 * @param {number} angle - 当前角度
 * @param {Object} interactionState - 交互状态对象
 * @param {number} scale - 地图缩放比例
 * @param {Object} SPRITE_FRAMES - 精灵帧数据
 */
export function drawShipSprites(
  props,
  mapInfo,
  mapContainer,
  Map,
  shipSpritesOnClick,
  departmentSpritesOnClick,
  spriteState,
  angle,
  interactionState,
  scale,
  SPRITE_FRAMES
) {
  // 清空现有精灵
  clearSprites(spriteState.spritesList);
  spriteState.imgLst.length = 0;
  // 验证数据
  if (!props?.projectMapLocationInfos || !props?.projectImgLst) {
    return;
  }
  // 准备图片数据
  const imageDataList = prepareShipImageData(props, mapInfo);
  // 加载并绘制船体精灵
  loadAndDrawShipSprites(
    imageDataList,
    props.projectImgLst,
    spriteState.spritesList,
    mapContainer,
    Map,
    mapInfo,
    shipSpritesOnClick,
    departmentSpritesOnClick,
    props,
    spriteState,
    angle,
    interactionState,
    SPRITE_FRAMES
  );
}

/**
 * 准备船体图片数据，转换为地图坐标
 * @param {Object} props - 包含船体位置信息的属性对象
 * @param {Object} mapInfo - 地图信息对象
 * @returns {Array} 转换后的船体图片数据数组
 */
const prepareShipImageData = (props, mapInfo) => {
  return props.projectMapLocationInfos.map((element) => {
    const [x, y] = convertLngLatToMapPixel(
      Number(element.CenterX),
      Number(element.CenterY),
      mapInfo
    );

    return {
      ...element,
      name: element.ShipNo,
      x,
      y,
      shipDirection: element.ShipDirection,
      shipDisplayRatio: element.ShipDisplayRatio,
      shipDisplayRatioEnd: element.ShipDisplayRatioEnd,
      Length: element.Length,
      Width: element.Width,
      Mirror: element.Mirror,
      ProjectInfoID: element.ProjectInfoID,
      Angle: element.Angle,
      ImageID: element.ImageID,
      showPositionSprite: element.showPositionSprite,
    };
  });
};

// 示例：创建positionSprite动画精灵
function createPositionSprite(item, mapInfo, angle, SPRITE_FRAMES) {
  // 检查帧数据是否存在
  if (
    !SPRITE_FRAMES.positionSprite ||
    SPRITE_FRAMES.positionSprite.length === 0
  ) {
    console.error("positionSprite帧数据未加载");
    return null;
  }

  // 创建动画精灵
  const animSprite = new PIXI.AnimatedSprite(SPRITE_FRAMES.positionSprite);
  animSprite.animationSpeed = 0.2;
  animSprite.loop = true;
  animSprite.anchor.set(0.5, 0.5); // 锚点居中（关键）
  animSprite.angle = angle || 0;

  animSprite.x = 2; // 容器已设为item.x，精灵在容器内居中
  animSprite.y = 15; // 仅偏移，不设全局坐标

  animSprite.scale.set(mapInfo?.Scale || 1); // 先应用地图缩放
  animSprite.scale.x *= 50 / animSprite.texture.width; // 固定宽度50（按纹理原始尺寸缩放）
  animSprite.scale.y *= 50 / animSprite.texture.height; // 固定高度50

  // 设置交互属性
  animSprite.projectInfoID = item.ProjectInfoID;
  animSprite.interactive = true;
  animSprite.buttonMode = true;
  animSprite.play();
  return animSprite;
}

const shipTextureCache = new Map();

// 加载并绘制船体精灵
const loadAndDrawShipSprites = (
  imageDataList,
  projectImgLst,
  spritesList,
  mapContainer,
  Map,
  mapInfo,
  shipSpritesOnClick,
  departmentSpritesOnClick,
  props,
  spriteState,
  angle,
  interactionState,
  SPRITE_FRAMES
) => {
  // 获取未加载的纹理元素
  const unloadedElements = getUnloadedTextureElements(projectImgLst);
  
  // 处理纹理加载和绘制
  if (unloadedElements.length > 0) {
    loadShipTextures(unloadedElements, () => {
      drawShipSpritesInternal(imageDataList, spritesList, mapContainer, Map, mapInfo, shipSpritesOnClick, departmentSpritesOnClick, props, spriteState, angle, interactionState, SPRITE_FRAMES);
    });
  } else {
    drawShipSpritesInternal(imageDataList, spritesList, mapContainer, Map, mapInfo, shipSpritesOnClick, departmentSpritesOnClick, props, spriteState, angle, interactionState, SPRITE_FRAMES);
  }
};

// 获取未加载的纹理元素
const getUnloadedTextureElements = (projectImgLst) => {
  return projectImgLst.filter(element => !shipTextureCache.has(element.ID));
};

// 加载船体纹理
const loadShipTextures = (unloadedElements, onLoadComplete) => {
  const loader = new PIXI.Loader();
  
  // 添加缓存中间件
  loader.use((resources, next) => {
    if (resources.url && resources.url.startsWith("data:image")) {
      const cacheKey = resources.name;
      if (shipTextureCache.has(cacheKey)) {
        resources.texture = shipTextureCache.get(cacheKey);
      } else {
        resources.texture = PIXI.Texture.from(resources.url);
        shipTextureCache.set(cacheKey, resources.texture);
      }
    }
    next();
  });
  
  // 添加未加载的纹理资源
  unloadedElements.forEach((element) => {
    const base64Img = getBase64ImageUrl(element);
    const cacheKey = element.ImageID || element.ID;
    loader.add(cacheKey, base64Img);
  });
  
  // 启动加载
  loader.load(() => {
    onLoadComplete();
  });
};

// 绘制船体精灵
const drawShipSpritesInternal = (
  imageDataList,
  spritesList,
  mapContainer,
  Map,
  mapInfo,
  shipSpritesOnClick,
  departmentSpritesOnClick,
  props,
  spriteState,
  angle,
  interactionState,
  SPRITE_FRAMES
) => {
  imageDataList.forEach((item) => {
    let sprite;
    
    // 绘制船体精灵
    if (!item.type) {
      sprite = createAndAddShipSprite(item, spriteState, spritesList, mapContainer, mapInfo, props, shipSpritesOnClick);
    }
    
    // 绘制位置标记
    if (item.showPositionSprite) {
      createAndAddShipPositionMarkers(
        item, 
        sprite,
        spritesList, 
        mapContainer, 
        Map, 
        mapInfo, 
        angle, 
        props, 
        shipSpritesOnClick, 
        departmentSpritesOnClick, 
        interactionState,
        SPRITE_FRAMES
      );
    }
  });
  
  Map.render();
};

// 创建并添加船体精灵
const createAndAddShipSprite = (item, spriteState, spritesList, mapContainer, mapInfo, props, shipSpritesOnClick) => {
  spriteState.imgLst.push(item);
  
  // 获取纹理
  const textureKey = item.ImageID;
  const cacheTexture = shipTextureCache.get(textureKey);
  const finalTexture = cacheTexture;
  
  // 创建精灵
  const spriteResources = { [textureKey]: { texture: finalTexture } };
  const sprite = createShipSprite(item, spriteResources, mapInfo);
  
  // 添加到容器
  if (sprite) {
    if (props.Clickable) {
      sprite.on("pointerdown", () => shipSpritesOnClick(sprite));
    }
    spritesList.push(sprite);
    mapContainer.addChild(sprite);
  } else {
    console.warn("跳过创建失败的船体精灵", item);
  }
  
  return sprite;
};

// 创建并添加船体位置标记
const createAndAddShipPositionMarkers = (
  item,
  sprite,
  spritesList,
  mapContainer,
  Map,
  mapInfo,
  angle,
  props,
  shipSpritesOnClick,
  departmentSpritesOnClick,
  interactionState,
  SPRITE_FRAMES
) => {
  // 创建容器
  const combinedContainer = new PIXI.Container();
  const staticContainer = new PIXI.Container();
  
  // 设置容器位置和角度
  combinedContainer.x = staticContainer.x = item.x;
  combinedContainer.y = staticContainer.y = item.y;
  combinedContainer.angle = staticContainer.angle = angle || 0;
  
  // 创建位置精灵
  const positionSprite = createShipPositionSprite(item, mapInfo, 0);
  const positionGifSprite = createPositionSprite(item, mapInfo, 0, SPRITE_FRAMES);
  
  // 设置位置精灵位置
  positionSprite.x = 0;
  positionSprite.y = -35;
  
  // 创建文本标签
  const text = createShipLabel(item, mapInfo);
  
  // 添加到容器
  staticContainer.addChild(positionGifSprite);
  combinedContainer.addChild(positionSprite);
  combinedContainer.addChild(text);
  
  // 设置交互事件
  if (props.Clickable) {
    setContainerInteraction(combinedContainer, staticContainer, item, sprite, shipSpritesOnClick, departmentSpritesOnClick);
  }
  
  // 添加到地图
  spritesList.push(staticContainer, combinedContainer);
  mapContainer.addChild(staticContainer, combinedContainer);
  
  // 添加悬停效果
  addSpriteHoverEffect(
    Map,
    mapContainer,
    combinedContainer,
    interactionState,
    {
      jumpHeight: SPRITE_CONFIG.HOVER_EFFECT.JUMP_HEIGHT,
      jumpDuration: SPRITE_CONFIG.HOVER_EFFECT.JUMP_DURATION,
    }
  );
};

// 创建船体标签
const createShipLabel = (item, mapInfo) => {
  const text = new PIXI.Text(item.name, {
    fontSize: SPRITE_CONFIG.SHIP.LABEL.FONT_SIZE,
    backgroundColor: SPRITE_CONFIG.SHIP.LABEL.BACKGROUND_COLOR,
    fill: SPRITE_CONFIG.SHIP.LABEL.FILL,
  });
  
  text.anchor.set(0.5, 0.5);
  text.x = SPRITE_CONFIG.SHIP.LABEL.X_OFFSET;
  text.y = SPRITE_CONFIG.SHIP.LABEL.Y_OFFSET;
  
  if (mapInfo?.Scale) {
    text.scale.x *= mapInfo.Scale;
    text.scale.y *= mapInfo.Scale;
  }
  
  return text;
};

// 设置容器交互事件
const setContainerInteraction = (combinedContainer, staticContainer, item, sprite, shipSpritesOnClick, departmentSpritesOnClick) => {
  combinedContainer.interactive = staticContainer.interactive = true;
  combinedContainer.buttonMode = staticContainer.buttonMode = true;
  
  if (!item.type) {
    combinedContainer.on("pointerdown", () => shipSpritesOnClick(sprite));
    staticContainer.on("pointerdown", () => shipSpritesOnClick(sprite));
  } else if (item.type === "department") {
    combinedContainer.on("pointerdown", () => departmentSpritesOnClick(combinedContainer, item));
    staticContainer.on("pointerdown", () => departmentSpritesOnClick(staticContainer, item));
  }
};

// 获取base64图片URL
const getBase64ImageUrl = (element) => {
  const type = SPRITE_CONFIG.IMAGE_TYPE_MAP[element.ImageType] || SPRITE_CONFIG.MATERIAL.DEFAULT_IMAGE_TYPE;
  return `data:image/${type};base64,${element.ImageData}`;
};

function addSpriteHoverEffect(
  app,
  parentContainer,
  sprite,
  state,
  options = {}
) {
  const { 
    jumpHeight = SPRITE_CONFIG.HOVER_EFFECT.JUMP_HEIGHT, 
    jumpDuration = SPRITE_CONFIG.HOVER_EFFECT.JUMP_DURATION, 
    zIndexTop = SPRITE_CONFIG.HOVER_EFFECT.Z_INDEX_TOP 
  } = options;

  // 保存初始状态（新增初始角度，确保旋转后跳动方向一致）
  const initialState = {
    zIndex: sprite.zIndex,
    x: sprite.x, // 保存初始X坐标（因为斜向跳动会修改x）
    y: sprite.y,
    angle: sprite.angle, // 保存Sprite初始旋转角度（避免动态旋转影响）
    parent: sprite.parent,
    interactive: sprite.interactive,
  };

  let isHovering = false;
  let isJumping = false;
  let animationFrame = null;
  const frameCount = Math.floor(jumpDuration / (1000 / 60));

  sprite.interactive = true;
  sprite.buttonMode = true;

  // 辅助函数：角度转弧度（PIXI的angle是度，数学计算需弧度）
  const degToRad = (deg) => deg * (Math.PI / 180);

  // 核心：根据Sprite角度，计算跳动方向向量（适配任意angle）
  function calculateJumpOffset(progress, jumpHeight) {
    // 1. 计算跳动高度（随缩放自适应）
    const adaptiveJumpHeight = jumpHeight;
    // 2. Sprite旋转角度（转弧度）
    const spriteAngleRad = degToRad(initialState.angle);
    // 3. 计算跳动方向向量：沿Sprite自身Y轴向上（旋转后的「视觉上方」）
    // 原理：旋转角度的垂直方向（Y轴向上）对应向量为 (sinθ, -cosθ)
    const offsetX = Math.sin(spriteAngleRad) * progress * adaptiveJumpHeight;
    const offsetY = -Math.cos(spriteAngleRad) * progress * adaptiveJumpHeight;
    return { offsetX, offsetY };
  }

  function startJumpLoop() {
    // 双重保险：取消旧动画帧
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    if (!isHovering || state.isDragging || state.isPinching) {
      isJumping = false;
      // 恢复初始位置（x和y都要恢复，因为斜向跳动修改了x）
      sprite.x = initialState.x;
      sprite.y = initialState.y;
      app.render();
      return;
    }

    isJumping = true;
    let currentFrame = 0;

    function animateSingleJump() {
      // 中途状态变化，立即停止
      if (!isHovering || state.isDragging || state.isPinching) {
        isJumping = false;
        sprite.x = initialState.x;
        sprite.y = initialState.y;
        cancelAnimationFrame(animationFrame);
        app.render();
        return;
      }

      currentFrame++;
      // 正弦曲线：0→2π 弧度（上跳→下落→回归）
      const progress = Math.sin((currentFrame / frameCount) * Math.PI);
      // 计算适配角度的跳动偏移量
      const { offsetX, offsetY } = calculateJumpOffset(progress, jumpHeight);

      // 更新Sprite位置（基于初始位置+偏移量，避免累积误差）
      sprite.x = initialState.x + offsetX;
      sprite.y = initialState.y + offsetY;

      app.render();

      // 循环跳动
      if (currentFrame >= frameCount) {
        currentFrame = 0;
        animationFrame = requestAnimationFrame(animateSingleJump);
      } else {
        animationFrame = requestAnimationFrame(animateSingleJump);
      }
    }

    animateSingleJump();
  }

  sprite.on("mouseover", () => {
    if (state.isDragging || state.isPinching) return;

    isHovering = true;
    isJumping = false; // 重置状态

    // 层级置顶
    parentContainer.sortableChildren = true;
    sprite.zIndex = zIndexTop;
    app.render();

    if (!isJumping) {
      startJumpLoop();
    }
  });

  sprite.on("mouseout", () => {
    isHovering = false;
    isJumping = false; // 重置状态

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    // 恢复初始位置和层级
    if (!state.isDragging && !state.isPinching) {
      sprite.x = initialState.x;
      sprite.y = initialState.y;
      sprite.zIndex = initialState.zIndex;
      app.render();
    }
  });

  return {
    destroy: () => {
      isHovering = false;
      isJumping = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      sprite.off("mouseover");
      sprite.off("mouseout");
      // 恢复所有初始状态
      sprite.x = initialState.x;
      sprite.y = initialState.y;
      sprite.zIndex = initialState.zIndex;
      sprite.interactive = initialState.interactive;
      app.render();
    },
  };
}

// 创建船体精灵
const createShipPositionSprite = (item, mapInfo, angle) => {
  // 验证资源是否存在
  let shipPisiton = PIXI.Loader.shared.resources["shipPisiton"];
  if (item.type === "department") {
    shipPisiton = PIXI.Loader.shared.resources["departmentPosition"];
  }
  if (!shipPisiton || !shipPisiton.texture) {
    console.error("船体位置纹理资源未找到");
    return;
  }
  shipPisiton = shipPisiton.texture;

  // 创建精灵
  const sprite = new PIXI.Sprite(shipPisiton);
  sprite.x = item.x + 7;
  sprite.y = item.y - 30;
  sprite.width = 85;
  sprite.height = 90;

  // 应用地图缩放比例（如果需要）
  if (mapInfo?.Scale) {
    sprite.scale.x *= mapInfo.Scale;
    sprite.scale.y *= mapInfo.Scale;
  }

  sprite.anchor.set(0.5, 0.5);
  sprite.angle = angle || 0;

  // 设置交互属性
  sprite.projectInfoID = item.ProjectInfoID;
  sprite.interactive = true;
  sprite.buttonMode = true;

  return sprite;
};

// 创建船体精灵
const createShipSprite = (item, resources, mapInfo) => {
  // 修复1：先校验ImageID是否存在
  if (!item.ImageID) {
    console.warn("创建船体精灵失败：item缺少ImageID", item);
    return null;
  }

  // 修复2：取纹理（兼容缓存逻辑的入参）
  const texture = resources[item.ImageID]?.texture;
  if (!texture) {
    console.warn(`未找到ID为${item.ImageID}的船体纹理`, {
      itemImageID: item.ImageID,
      availableResources: Object.keys(resources) // 打印可用的纹理ID，便于排查不匹配问题
    });
    return null;
  }

  try {
    // 修复3：包裹裁剪逻辑，防止裁剪失败导致报错
    const percentage = item.shipDisplayRatioEnd - item.shipDisplayRatio;
    const { croppedTexture } = getCroppedShipTexture(texture, item, percentage);

    // 校验裁剪后的纹理
    if (!croppedTexture) {
      console.warn(`ID为${item.ImageID}的纹理裁剪失败`, item);
      return null;
    }

    // 创建精灵
    const sprite = new PIXI.Sprite(croppedTexture);
    sprite.x = item.x;
    sprite.y = item.y;

    // 修复大小计算 - 确保与原始行为一致
    const scaleFactor = item.Length / texture.width;
    sprite.scale.x = scaleFactor;
    sprite.scale.y = item.Width / texture.height;

    // 应用镜像和地图缩放
    if (item.Mirror) {
      sprite.scale.x = -sprite.scale.x;
    }

    if (mapInfo?.Scale) {
      sprite.scale.x *= mapInfo.Scale;
      sprite.scale.y *= mapInfo.Scale;
    }

    sprite.anchor.set(0.5, 0.5);
    sprite.angle = item.Angle || 0;

    // 设置交互属性
    sprite.projectInfoID = item.ProjectInfoID;
    sprite.interactive = true;
    sprite.buttonMode = true;

    return sprite;
  } catch (e) {
    // 修复4：捕获创建过程中的异常，避免方法直接崩溃
    console.error(`创建ID为${item.ImageID}的船体精灵失败`, e, item);
    return null;
  }
};

// 获取裁剪后的船体纹理
const getCroppedShipTexture = (texture, item, percentage) => {
  const textureWidth = texture.width;
  const textureHeight = texture.height;

  // 计算裁剪区域
  const cropWidth = textureWidth * percentage;
  const cropHeight = textureHeight;
  const cropX = item.shipDirection
    ? textureWidth * item.shipDisplayRatio
    : textureWidth * (1 - item.shipDisplayRatioEnd);
  const cropY = 0;

  // 创建裁剪区域
  const cropRect = new PIXI.Rectangle(cropX, cropY, cropWidth, cropHeight);
  return {
    croppedTexture: new PIXI.Texture(texture.baseTexture, cropRect),
    cropWidth,
  };
};

// 清空精灵数组并销毁精灵
const clearSprites = (spritesArray) => {
  if (Array.isArray(spritesArray) && spritesArray.length > 0) {
    spritesArray.forEach((item) => {
      // 检查item是否有效且有destroy方法
      if (item && item.destroy && typeof item.destroy === "function") {
        try {
          // 在销毁前移除所有事件监听器，避免交互系统继续引用
          item.removeAllListeners();
          // 标记为不可交互
          item.interactive = false;
          item.buttonMode = false;
          // 销毁精灵
          item.destroy({ children: true });
        } catch (e) {
          console.warn("销毁精灵时出错:", e);
        }
      }
    });
    // 清空数组
    spritesArray.splice(0, spritesArray.length);
  }
};

/**
 * 绘制物资精灵
 * @param {Object} props - 包含物资数据的属性对象
 * @param {Object} mapInfo - 地图信息对象
 * @param {Object} ConfigParams - 配置参数
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Function} materialOnClick - 物资点击事件处理函数
 * @param {Object} spriteState - 精灵状态管理对象
 * @param {Object} Map - 地图对象，包含render方法
 */
export function drawMaterials(
  props,
  mapInfo,
  ConfigParams,
  mapContainer,
  materialOnClick,
  spriteState,
  Map
) {
  // 清空现有的物资图形
  if (spriteState.materials.length) {
    spriteState.materials.forEach((item) => item.destroy());
    spriteState.materials = [];
  }

  const materialImgLst = props.materialMapLocationInfos?.ImageResources || [];
  const polygonLst = props.materialMapLocationInfos?.MaterialMapLocations || [];
  const loader = PIXI.Loader.shared; // 使用共享Loader

  // 记录需要加载的资源
  let resourcesToLoad = [];

  // 检查并添加未加载的资源
  materialImgLst.forEach((element) => {
    // 检查缓存中是否已存在该资源
    if (!loader.resources[element.ID]) {
      let base64Img;
      switch (element.ImageType) {
        case 0:
          base64Img = "data:image/svg;base64," + element.ImageData;
          break;
        case 1:
          base64Img = "data:image/png;base64," + element.ImageData;
          break;
        case 2:
          base64Img = "data:image/jpg;base64," + element.ImageData;
          break;
      }
      resourcesToLoad.push({
        name: element.ID,
        url: base64Img,
      });
    }
  });

  // 处理资源加载
  // 处理资源加载（安全版本）
  const loadResources = () => {
    // 检查是否有资源需要加载
    if (resourcesToLoad.length === 0) {
      return Promise.resolve();
    }

    const loader = PIXI.Loader.shared;

    // 如果加载器正在运行，等待完成后再递归处理
    if (loader.loading) {
      return new Promise((resolve) => {
        loader.onComplete.once(() => {
          // 递归调用，处理剩余资源
          loadResources().then(resolve);
        });
      });
    }

    // 加载器空闲，添加并加载资源
    const currentResources = [...resourcesToLoad]; // 复制当前需要加载的资源
    resourcesToLoad = []; // 清空待加载列表（避免重复加载）

    return new Promise((resolve) => {
      // 添加资源
      currentResources.forEach((res) => {
        // 避免重复添加已加载的资源
        if (!loader.resources[res.name]) {
          loader.add(res);
        }
      });

      // 启动加载
      loader.load((_, resources) => {
        resolve(resources);
      });
    });
  };

  // 加载完成后创建图形
  loadResources().then(() => {
    polygonLst.forEach((item) => {
      if (item.DisplayStyle === 0) {
        // 多边形类型处理
        const { centerX, centerY } = calculateBounds(item.MapPoints, {
          xKey: "X",
          yKey: "Y",
          includeCenter: true,
        });
        item.centerX = centerX;
        item.centerY = centerY;

        const polygonVertices = processPolygonVertices(
          item.MapPoints,
          centerX,
          centerY
        );

        const graphic = createPolygonGraphic(
          item,
          polygonVertices,
          mapInfo,
          ConfigParams?.MaterialBoarder,
          item.DefaultColor,
          item.Transparency
        );

        graphic.Name = item.Name;
        graphic.on("pointerdown", () => materialOnClick(graphic, false));

        spriteState.materials.push(graphic);
        mapContainer.addChild(graphic);
      } else {
        // 精灵类型处理
        const sprite = createSprite(item, loader.resources, mapInfo);
        sprite.on("pointerdown", () => materialOnClick(sprite, true));
        mapContainer.addChild(sprite);
        spriteState.materials.push(sprite);
      }
    });
    
    // 优化性能：只在所有图形创建完成后渲染一次
    Map.render();
  });
}

/**
 * 绘制PBS（泊位）精灵
 * @param {Object} props - 包含PBS数据的属性对象
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Object} Map - 地图对象，包含render方法
 * @param {Object} ConfigParams - 配置参数
 * @param {Object} mapInfo - 地图信息对象
 * @param {Function} PBSOnClick - PBS点击事件处理函数
 * @param {Function} materialOnClick - 物资点击事件处理函数
 * @param {Object} spriteState - 精灵状态管理对象
 */
export function drawPBSs(
  props,
  mapContainer,
  Map,
  ConfigParams,
  mapInfo,
  PBSOnClick,
  materialOnClick,
  spriteState
) {
  // // 过滤需要显示的PBS数据
  // const newPBSDataList =
  //   props.NowPBSs?.filter((it) => it?.MapPoints?.length) || [];
  // // 1. 复用现有PBS实例：更新已存在的PBS
  // spriteState.PBSs.forEach((existingPBS) => {
  //   // 查找当前PBS在新数据中是否存在
  //   const matchedData = newPBSDataList.find(
  //     (data) => data.PBSID === existingPBS.PBSID
  //   );
  //   if (matchedData) {
  //     // 1.1 存在：更新属性（位置、样式、角度等）
  //     updatePBSProperties(
  //       existingPBS,
  //       matchedData,
  //       props,
  //       ConfigParams,
  //       mapInfo,
  //       Map,
  //       PBSOnClick,
  //       materialOnClick
  //     );
  //   } else {
  //     // 1.2 不存在：隐藏（而非销毁），留待后续复用
  //     existingPBS.visible = false;
  //   }
  // });

  // // 2. 创建新实例：处理新数据中不存在的PBS
  // newPBSDataList.forEach((newData) => {
  //   // 检查是否已有对应的PBS实例
  //   const existingPBS = spriteState.PBSs.find((pbs) => pbs.PBSID === newData.PBSID);

  //   if (!existingPBS) {
  //     // 2.1 不存在：创建新PBS并添加到容器
  //     const newPBS = createPBS(
  //       newData,
  //       props,
  //       ConfigParams,
  //       mapInfo,
  //       Map,
  //       PBSOnClick,
  //       materialOnClick
  //     );
  //     spriteState.PBSs.push(newPBS);
  //     mapContainer.addChild(newPBS);
  //   }
  // });

  // // 3. 排序并处理高亮逻辑
  // spriteState.PBSs.sort((a, b) => a.FillColor - b.FillColor);
  // spriteState.PBSs.forEach((it) => {
  //   // 仅对可见的PBS处理高亮
  //   if (it.visible) {
  //     if (
  //       props.showLightPBSs.length === 1 &&
  //       it.PBSID === props.showLightPBSs[0]
  //     ) {
  //       PBSOnClick(it);
  //     }
  //   }
  // });
  // // 初始化渲染
  // Map.render();

  // 清空现有的PBSs图形
  spriteState.PBSs.forEach((item) => item.destroy());
  spriteState.PBSs = [];

  // 过滤并处理每个PBS
  props.NowPBSs?.filter((it) => it?.MapPoints?.length).forEach((item) => {
    // 使用公共函数计算边界和中心
    const { centerX, centerY } = calculateBounds(item.MapPoints, {
      xKey: "X",
      yKey: "Y",
      includeCenter: true,
    });
    item.centerX = centerX;
    item.centerY = centerY;

    // 创建PBS图形
    const PBS = createPBS(
      item,
      props,
      ConfigParams,
      mapInfo,
      Map,
      PBSOnClick,
      materialOnClick
    );

    spriteState.PBSs.push(PBS);
  });

  // 排序并添加到容器
  spriteState.PBSs.sort((a, b) => a.FillColor - b.FillColor).forEach((it) => {
    mapContainer.addChild(it);

    // 处理高亮PBS
    if (
      props.showLightPBSs.length === 1 &&
      it.PBSID === props.showLightPBSs[0]
    ) {
      PBSOnClick(it);
    }
  });

  // 初始化渲染
  Map.render();
}
// 更新现有PBS的属性（核心优化点）
const updatePBSProperties = (
  pbs,
  data,
  props,
  ConfigParams,
  mapInfo,
  Map,
  PBSOnClick,
  materialOnClick
) => {
  // 1. 显示实例（可能之前被隐藏）
  pbs.visible = true;

  // 2. 更新位置和变换属性
  const picCenter = lngLatToMercator(
    Number(data.CenterY),
    Number(data.CenterX)
  );
  pbs.x = picCenter[0] - mapInfo.Origin?.X;
  pbs.y = -(picCenter[1] + mapInfo.Origin?.Y);
  pbs.angle = data.Angle;
  pbs.scale.x = mapInfo.Scale
    ? data.Mirror
      ? -mapInfo.Scale
      : mapInfo.Scale
    : 1;
  pbs.scale.y = mapInfo.Scale || 1;

  // 3. 更新多边形顶点（如果形状变化）
  const { centerX, centerY } = calculateBounds(data.MapPoints, {
    xKey: "X",
    yKey: "Y",
    includeCenter: true,
  });
  const newVertices = processPolygonVertices(data.MapPoints, centerX, centerY);
  pbs.MyPolygonVertices = newVertices; // 更新缓存的顶点

  // 4. 更新样式（颜色、边框等）
  updatePBSVisualStyle(pbs, data, props, ConfigParams, Map);

  // 5. 更新交互事件（如果需要）
  if (props.Clickable) {
    // 先移除旧事件（避免重复绑定）
    pbs.removeAllListeners("pointerdown");
    // 重新绑定事件
    if (pbs.RefObjectType === 0) {
      pbs.on("pointerdown", () => PBSOnClick(pbs));
    } else if (pbs.RefObjectType === 1) {
      pbs.on("pointerdown", () => materialOnClick(pbs, false));
    }
  }

  // 6. 更新其他自定义属性
  pbs.MyAngle = data.Angle;
  pbs.MyMirror = data.Mirror;
  pbs.PBSCode = data.PBSCode;
  pbs.RefObjectType = data.RefObjectType;
};

// 更新PBS的视觉样式（颜色、填充、边框）
const updatePBSVisualStyle = (pbs, data, props, ConfigParams, Map) => {
  // 清除之前的绘制
  pbs.clear();

  // 确定填充颜色
  let color = props.NowLightPBSsID.includes(data.PBSID)
    ? props.oneDefaultColor &&
      props.NowPBSs.length !== props.NowLightPBSsID.length
      ? 0xffffff
      : data.DefaultColor
    : 0xaaaaaa;

  // 处理显示高亮逻辑
  if (props.showLightPBSs.length) {
    color =
      props.NowPBSs.length === props.showLightPBSs.length ||
      props.showLightPBSs.includes(data.PBSID)
        ? data.DefaultColor
        : 0xaaaaaa;
  }
  pbs.FillColor = color; // 更新缓存的颜色

  // 设置边框
  if (ConfigParams?.PBSBoarder === 1) {
    pbs.lineStyle(1, 0x000000, 1);
  }

  // 高亮边框处理
  if (
    props.showLightPBSs.length !== props.NowPBSs.length &&
    props.showLightPBSs.includes(data.PBSID)
  ) {
    pbs.lineStyle(3, 0xdc143c, 1);
  }

  // 填充样式（网格纹理或纯色）
  if (data.PlanStatus === 1) {
    const renderTexture = generateGridTexture(color, data.Transparency, Map);
    pbs.beginTextureFill({ texture: renderTexture });
  } else {
    pbs.beginFill(color, data.Transparency);
  }

  // 重新绘制多边形
  pbs.drawPolygon(pbs.MyPolygonVertices);
  pbs.endFill();
};
// 创建PBS图形的函数
const createPBS = (
  item,
  props,
  ConfigParams,
  mapInfo,
  Map,
  PBSOnClick,
  materialOnClick
) => {
  // 关键修复：计算并添加centerX和centerY（与update逻辑保持一致）
  const { centerX, centerY } = calculateBounds(item.MapPoints, {
    xKey: "X",
    yKey: "Y",
    includeCenter: true,
  });
  // 给item添加这两个属性，确保后续使用时不报错
  item.centerX = centerX;
  item.centerY = centerY;

  // 现在调用processPolygonVertices时，item.centerX和item.centerY已定义
  const polygonVertices = processPolygonVertices(
    item.MapPoints,
    item.centerX,
    item.centerY
  );
  // 确定颜色
  let color = props.NowLightPBSsID.includes(item.PBSID)
    ? props.oneDefaultColor &&
      props.NowPBSs.length !== props.NowLightPBSsID.length
      ? 0xffffff
      : item.DefaultColor
    : 0xaaaaaa;

  // 处理显示高亮逻辑
  if (props.showLightPBSs.length) {
    color =
      props.NowPBSs.length === props.showLightPBSs.length ||
      props.showLightPBSs.includes(item.PBSID)
        ? item.DefaultColor
        : 0xaaaaaa;
  }

  // 创建基础图形
  const PBS = new PIXI.Graphics();

  // 设置边框
  if (ConfigParams?.PBSBoarder === 1) {
    PBS.lineStyle(1, 0x000000, 1);
  }

  // 高亮边框处理
  if (
    props.showLightPBSs.length !== props.NowPBSs.length &&
    props.showLightPBSs.includes(item.PBSID)
  ) {
    PBS.lineStyle(3, 0xdc143c, 1);
  }

  // 计算中心坐标
  const picCenter = lngLatToMercator(
    Number(item.CenterY),
    Number(item.CenterX)
  );

  // 设置位置和变换
  PBS.x = picCenter[0] - mapInfo.Origin?.X;
  PBS.y = -(picCenter[1] + mapInfo.Origin?.Y);
  PBS.angle = item.Angle;
  PBS.scale.x = mapInfo.Scale
    ? item.Mirror
      ? -mapInfo.Scale
      : mapInfo.Scale
    : 1;
  PBS.scale.y = mapInfo.Scale || 1;
  PBS.CenterY = item.CenterY;
  PBS.CenterX = item.CenterX;
  // 填充样式（网格纹理或纯色）
  if (item.PlanStatus === 1) {
    const renderTexture = generateGridTexture(color, item.Transparency, Map);
    PBS.beginTextureFill({ texture: renderTexture });
  } else {
    PBS.beginFill(color, item.Transparency);
  }

  PBS.drawPolygon(polygonVertices);
  PBS.endFill();

  // 设置交互属性
  PBS.interactive = true;
  PBS.buttonMode = true;

  // PBS特有属性
  PBS.PBSID = item.PBSID;
  PBS.MyPolygonVertices = polygonVertices;
  PBS.MyAngle = item.Angle;
  PBS.MyMirror = item.Mirror;
  PBS.FillColor = color;
  PBS.RefObjectType = item.RefObjectType;
  PBS.PBSCode = item.PBSCode;

  // 设置点击事件
  if (props.Clickable) {
    if (PBS.RefObjectType === 0) {
      PBS.on("pointerdown", () => PBSOnClick(PBS));
    } else if (PBS.RefObjectType === 1) {
      PBS.on("pointerdown", () => materialOnClick(PBS, false));
    }
  }

  return PBS;
};

// 创建图形纹理
const generateGridTexture = (color, opacity, Map) => {
  const gridGraphics = new PIXI.Graphics();
  gridGraphics.lineStyle(1, color, opacity);
  gridGraphics.beginFill(0xffffff, opacity);
  const gridSize = SPRITE_CONFIG.GRID_TEXTURE.GRID_SIZE;
  const textureSize = SPRITE_CONFIG.GRID_TEXTURE.TEXTURE_SIZE;
  
  for (let i = 0; i <= textureSize; i += gridSize) {
    gridGraphics.moveTo(i, 0);
    gridGraphics.lineTo(i, textureSize);
    gridGraphics.moveTo(0, i);
    gridGraphics.lineTo(textureSize, i);
  }
  
  const renderTexture = PIXI.RenderTexture.create({
    width: textureSize,
    height: textureSize,
  });
  
  Map.renderer?.render(gridGraphics, renderTexture);
  return renderTexture;
};