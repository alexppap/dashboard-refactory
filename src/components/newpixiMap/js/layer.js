import {
  drawDashedPolygon,
  getStringLength,
  findPolygonCentroid,
  createPolygonGraphic
} from "./mapUtils";
import { reactive } from "vue";
import { customConfig } from "@/api";

// 常量配置 - 集中管理参数
const LAYER_CONFIG = {
  TEXT_SCALE: 0.06, // 文本缩放比例
  TEXT_SIZE_MULTIPLIER: customConfig?.ProjectProcess?.Params?.Params?.TEXT_SIZE_MULTIPLIER ?? 8, // 文本大小乘数
  MAX_FONT_WIDTH: 10, // 最大字体宽度
  MIN_FONT_WIDTH: 4, // 最小字体宽度
  DASH_SIZE: 4, // 虚线间隔
  TEXT_CONTAINER_ZINDEX: 999, // 文本容器层级
};

// 创建独立状态的工厂函数
export function createMapLayerState() {
  return {
    MapLayer: reactive([]), // 地图实例（每个组件独立）
    fieldTextLst: reactive([]), // 场地文字实例（每个组件独立）
  };
}

/**
 * 绘制多边形图形
 * @param {PIXI.Graphics} graphics - 图形对象
 * @param {Array} vertices - 多边形顶点
 * @param {Object} style - 样式配置
 * @param {number} [style.alpha=1] - 透明度（0-1）
 */
const drawPolygon = (graphics, vertices, style) => {
  const { fillColor, borderWidth, borderColor, borderType, alpha = 1 } = style;
  
  // 设置透明度
  graphics.alpha = alpha;

  // 填充颜色
  if (fillColor) {
    graphics.beginFill(fillColor);
  }

  // 绘制线条（实线或虚线）
  if (borderType === "Default") {
    graphics.lineStyle(borderWidth, borderColor);
    graphics.drawPolygon(vertices);
  } else {
    // 虚线绘制：先绘制填充，再绘制虚线边框
    graphics.drawPolygon(vertices);
    graphics.lineStyle(borderWidth, borderColor);
    drawDashedPolygon(graphics, vertices, LAYER_CONFIG.DASH_SIZE);
  }

  graphics.endFill();
};

/**
 * 处理多边形顶点，去重并收集坐标
 * @param {Array} mapPoints - 原始点位
 * @param {Array} xarr - X坐标数组
 * @param {Array} yarr - Y坐标数组
 * @param {Array} arr - 点位数组
 * @returns {Object} 处理后的顶点信息
 */
const processPolygonVertices = (mapPoints, xarr, yarr, arr) => {
  const vertices = [];
  const verticesOrigin = [];

  mapPoints?.forEach((point, i) => {
    // 收集坐标信息
    xarr.push(point.X);
    yarr.push(point.Y);
    arr.push(point);

    // 去重处理（与上一个点比较，直接比较坐标提高效率）
    const prevPoint = mapPoints[i - 1];
    const isDifferentPoint = i === 0 || 
                            point.X !== prevPoint.X || 
                            point.Y !== prevPoint.Y;
    
    if (isDifferentPoint) {
      vertices.push(point.X, point.Y);
      verticesOrigin.push(point);
    }
  });

  return { vertices, verticesOrigin };
};

/**
 * 创建并配置文本元素
 * @param {string} text - 文本内容
 * @param {Object} options - 配置选项
 * @returns {PIXI.Text} 文本元素
 */
const createTextElement = (text, options) => {
  const { centerX, centerY, textColor, visible = true, width = 0 } = options;

  // 计算字体宽度（直接使用文本，避免JSON.stringify）
  const textLength = getStringLength(text);
  const calculatedFontWidth = width > 0 && textLength > 0 ? width / textLength : LAYER_CONFIG.MIN_FONT_WIDTH;
  const fontWidth = Math.min(
    LAYER_CONFIG.MAX_FONT_WIDTH,
    Math.max(LAYER_CONFIG.MIN_FONT_WIDTH, calculatedFontWidth)
  );

  // 创建文本元素
  const elementText = new PIXI.Text(text, {
    fontSize: fontWidth * LAYER_CONFIG.TEXT_SIZE_MULTIPLIER,
    fill: textColor,
    backgroundColor: "#fff",
  });

  // 设置位置、缩放和可见性
  elementText.position.set(centerX, centerY);
  elementText.scale.set(LAYER_CONFIG.TEXT_SCALE);
  elementText.visible = visible;

  // 计算并设置中心点（考虑缩放影响）
  const originalScale = 1 / LAYER_CONFIG.TEXT_SCALE;
  elementText.pivot.set(
    (elementText.width * originalScale) / 2,
    (elementText.height * originalScale) / 2
  );

  return elementText;
};

/**
 * 绘制Hull模式下的图层
 * @param {Array} xarr - X坐标数组
 * @param {Array} yarr - Y坐标数组
 * @param {Array} arr - 点位数组
 * @param {Object} props - 属性
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Function} onHullFieldClick - 点击事件处理函数
 * @param {Object} state - 状态对象
 */
const drawHullLayer = (
  xarr,
  yarr,
  arr,
  props,
  mapContainer,
  onHullFieldClick,
  state
) => {
  const { MapLayer, fieldTextLst } = state;
  const elements = JSON.parse(JSON.stringify(props.mapLayerInfos));

  elements.forEach((element) => {
    // 处理顶点
    const { vertices, verticesOrigin } = processPolygonVertices(
      element.MapPoints,
      xarr,
      yarr,
      arr
    );

    // 创建图形元素
    const mapElement = createMapElement(element, vertices, verticesOrigin, onHullFieldClick);

    // 添加到图层和容器
    MapLayer.push(mapElement);
    mapContainer.addChild(mapElement);

    // 绘制文本（如果有名称）
    if (mapElement.name) {
      const elementText = createTextElement(mapElement.name, {
        centerX: mapElement.centerX,
        centerY: mapElement.centerY,
        textColor: mapElement.textColor,
        visible: props.feildTextVisible,
        width: mapElement.width,
      });

      fieldTextLst.push(elementText);
      mapContainer.addChild(elementText);
    }
  });
};

/**
 * 绘制可点击模式下的图层
 * @param {Array} xarr - X坐标数组
 * @param {Array} yarr - Y坐标数组
 * @param {Array} arr - 点位数组
 * @param {Object} mapInfo - 地图信息
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Object} state - 状态对象
 */
const drawClickableLayer = (xarr, yarr, arr, mapInfo, mapContainer, state) => {
  const { MapLayer } = state;

  // 按ZIndex排序图层
  mapInfo.LayerInfos.sort((a, b) => b.ZIndex - a.ZIndex).forEach((layer) => {
    layer.Elements.forEach((element) => {
      if (element.Type === "Polygon") {
        // 处理顶点
        const { vertices, verticesOrigin } = processPolygonVertices(
          element.MapPoints,
          xarr,
          yarr,
          arr
        );

        // 创建图形元素
const mapElement = createPolygonGraphic(
  element, // item
  vertices, // polygonVertices
  null, // mapInfo - 这里不需要，因为是直接设置位置
  { width: element.BorderWidth, color: element.BorderColor }, // borderConfig - 自定义边框配置
  element.FillColor, // fillColor
  1, // transparency
  {
    centerCalculation: false, // 不计算中心，直接设置位置
    interactive: true, // 设置交互
    position: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1 } // 初始位置
  }
);

        // 存储信息和交互设置
        mapElement.FieldID = element.FieldID;
        mapElement.polygonVertices = vertices;
        mapElement.interactive = true;
        mapElement.buttonMode = true;

        // 计算中心点
        const [centerX, centerY] = findPolygonCentroid(verticesOrigin);
        mapElement.centerX = centerX;
        mapElement.centerY = centerY;

        // 添加到图层和容器
        MapLayer.push(mapElement);
        mapContainer.addChild(mapElement);
      }
      // 文本类型元素处理（当前注释掉，保留结构）
      // else if (element.Type === "Text") { ... }
    });
  });
};

/**
 * 绘制合并模式下的图层
 * @param {Array} xarr - X坐标数组
 * @param {Array} yarr - Y坐标数组
 * @param {Array} arr - 点位数组
 * @param {Object} mapInfo - 地图信息
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Object} state - 状态对象
 */
const drawMergedLayer = (xarr, yarr, arr, mapInfo, mapContainer, state) => {
  const { MapLayer } = state;

  // 这些是用于绘制多个多边形的容器，不适合使用createPolygonGraphic
const mainGraphics = new PIXI.Graphics();
const textGraphics = new PIXI.Graphics();
textGraphics.zIndex = LAYER_CONFIG.TEXT_CONTAINER_ZINDEX;

  mapContainer.addChild(mainGraphics);
  mapContainer.addChild(textGraphics);

  // 按ZIndex排序图层
  mapInfo.LayerInfos.sort((a, b) => b.ZIndex - a.ZIndex).forEach((layer) => {
    const targetGraphics = layer.ZIndex !== -10 ? mainGraphics : textGraphics;
    const alpha = layer.ZIndex !== -10 ? 1 : 0.5;

    layer.Elements.forEach((element) => {
      if (element.Type === "Polygon") {
        // 处理顶点
        const { vertices } = processPolygonVertices(
          element.MapPoints,
          xarr,
          yarr,
          arr
        );

        // 绘制多边形
        drawPolygon(targetGraphics, vertices, {
          fillColor: element.FillColor,
          borderWidth: element.BorderWidth,
          borderColor: element.BorderColor,
          borderType: element.BorderType || "Default",
          alpha,
        });
      }
      // 文本类型元素处理（当前注释掉，保留结构）
      // else if (element.Type === "Text") { ... }
    });
  });

  // 添加到图层
  MapLayer.push(mainGraphics);
  MapLayer.push(textGraphics);
};

/**
 * 创建并配置地图图形元素
 * @param {Object} element - 地图元素数据
 * @param {Array} vertices - 多边形顶点
 * @param {Array} verticesOrigin - 原始顶点数据
 * @param {Function} [clickHandler] - 点击事件处理函数
 * @returns {PIXI.Graphics} 配置好的图形元素
 */
const createMapElement = (element, vertices, verticesOrigin, clickHandler) => {
  // 创建图形元素，使用统一的createPolygonGraphic函数
  const mapElement = createPolygonGraphic(
    element, // item
    vertices, // polygonVertices
    null, // mapInfo - 这里不需要，因为是直接设置位置
    { width: element.BorderWidth, color: element.BorderColor }, // borderConfig - 自定义边框配置
    element.FillColor, // fillColor
    1, // transparency
    {
      centerCalculation: false, // 不计算中心，直接设置位置
      interactive: true, // 设置交互
      position: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1 } // 初始位置
    }
  );

  // 存储图块信息
  mapElement.FieldID = element.FieldID;
  mapElement.name = element.Name;
  mapElement.textColor = element.TextColor;
  mapElement.BorderWidth = element.BorderWidth;
  mapElement.BorderColor = element.BorderColor;
  
  // 设置交互
  if (clickHandler) {
    mapElement.on("pointerdown", clickHandler);
  }

  // 计算并存储中心点
  const [centerX, centerY] = findPolygonCentroid(verticesOrigin);
  mapElement.centerX = centerX;
  mapElement.centerY = centerY;

  return mapElement;
};

/**
 * 清除地图图层
 * @param {Object} state - 地图状态对象
 */
const clearMapLayers = (state) => {
  const { MapLayer, fieldTextLst } = state;
  
  // 销毁并清除地图元素
  MapLayer.forEach((item) => {
    if (item && item.destroy && typeof item.destroy === "function") {
      try {
        // 在销毁前移除所有事件监听器，避免交互系统继续引用
        item.removeAllListeners();
        // 标记为不可交互
        item.interactive = false;
        item.buttonMode = false;
        // 销毁元素
        item.destroy({ children: true });
      } catch (e) {
        console.warn("销毁地图元素时出错:", e);
      }
    }
  });
  MapLayer.splice(0);
  
  // 销毁并清除文本元素
  fieldTextLst.forEach((item) => {
    if (item && item.destroy && typeof item.destroy === "function") {
      try {
        // 在销毁前移除所有事件监听器
        item.removeAllListeners();
        // 标记为不可交互
        item.interactive = false;
        item.buttonMode = false;
        // 销毁元素
        item.destroy({ children: true });
      } catch (e) {
        console.warn("销毁文本元素时出错:", e);
      }
    }
  });
  fieldTextLst.splice(0);
};

/**
 * 绘制底图主函数
 * @param {Array} xarr - X坐标数组
 * @param {Array} yarr - Y坐标数组
 * @param {Array} arr - 点位数组
 * @param {Object} props - 属性
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Function} onHullFieldClick - 点击事件处理函数
 * @param {Object} mapInfo - 地图信息
 * @param {Object} state - 状态对象
 */
export function drawLayer(
  xarr,
  yarr,
  arr,
  props,
  mapContainer,
  onHullFieldClick,
  mapInfo,
  state
) {
  // 清空现有图层
  clearMapLayers(state);

  // 根据不同模式绘制图层
  if (props.isHull) {
    drawHullLayer(
      xarr,
      yarr,
      arr,
      props,
      mapContainer,
      onHullFieldClick,
      state
    );
  } else if (props.fieldClickable) {
    drawClickableLayer(xarr, yarr, arr, mapInfo, mapContainer, state);
  } else {
    drawMergedLayer(xarr, yarr, arr, mapInfo, mapContainer, state);
  }
}