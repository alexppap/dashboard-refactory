/**
 * @file block.js
 * @description 地图总段和预组绘制模块
 * @author - 
 * @date - 
 */

import { rgbaToPixiColor, getStringLength, drawDashedLines, createPolygonGraphic } from "./mapUtils";
import { reactive } from "vue";
import { customConfig } from "@/api";

// 项目配置参数
const ProjectProcessParams = customConfig?.ProjectProcess?.Params;

/**
 * 默认配置常量
 * @constant
 * @type {Object}
 * @property {number} FONT_SIZE_MULTIPLIER - 字体大小倍率
 * @property {number} SCALE_FACTOR - 缩放因子
 * @property {number} BACKGROUND_PADDING - 背景填充边距
 * @property {number} BACKGROUND_HEIGHT - 背景高度
 * @property {number} FONT_WIDTH_MIN - 字体宽度最小值
 * @property {number} FONT_WIDTH_MAX - 字体宽度最大值
 */
const DEFAULT_CONFIG = {
  FONT_SIZE_MULTIPLIER: ProjectProcessParams?.Params?.FONT_SIZE_MULTIPLIER || 35,
  SCALE_FACTOR: 0.06,
  BACKGROUND_PADDING: 6,
  BACKGROUND_HEIGHT: 5,
  FONT_WIDTH_MIN: 4,
  FONT_WIDTH_MAX: 10,
};

/**
 * 图层和文本清理工具函数
 * @param {Array} list - 要清理的图层或文本列表
 */
const clearList = (list) => {
  if (Array.isArray(list) && list.length > 0) {
    list.forEach((item) => item.destroy?.());
    list.splice(0, list.length);
  }
};

/**
 * 创建图形图层
 * @param {Array} layerArray - 图层数组引用
 * @param {PIXI.Container} container - 地图容器
 * @param {boolean} visible - 是否可见
 * @returns {PIXI.Graphics} 创建的图形图层
 */
const createGraphicLayer = (layerArray, container, visible = true) => {
  const graphic = new PIXI.Graphics();
  graphic.visible = visible;
  layerArray.push(graphic);
  container.addChild(graphic);
  return graphic;
};

/**
 * 计算实际坐标点
 * @param {Object} point - 原始坐标点 {X, Y}
 * @param {Array} mapCenterPoints - 地图中心点 [x, y]
 * @returns {Object} 转换后的实际坐标点 {x, y}
 */
const calculateActualPoint = (point, mapCenterPoints) => ({
  x: point.X - mapCenterPoints[0],
  y: -(point.Y - mapCenterPoints[1])
});

/**
 * 绘制文本背景
 * @param {Object} params - 绘制参数
 * @param {PIXI.Graphics} params.graphic - 图形绘制对象
 * @param {Object} params.centerPoint - 中心点坐标
 * @param {PIXI.Text} params.textElement - 文本元素
 * @param {string} params.fillColor - 填充颜色
 * @param {string} params.borderColor - 边框颜色
 * @param {number} params.lineWidth - 边框宽度
 * @param {boolean} params.showBorder - 是否显示边框
 */
const drawTextBackground = ({
  graphic,
  centerPoint,
  textElement,
  fillColor,
  borderColor,
  lineWidth,
  showBorder,
}) => {
  const width = textElement.width + DEFAULT_CONFIG.BACKGROUND_PADDING;
  const height = DEFAULT_CONFIG.BACKGROUND_HEIGHT;
  const x = centerPoint.x - width / 2;
  const y = centerPoint.y - height / 2;

  // 设置边框样式
  if (showBorder) {
    const pixiBorderColor = rgbaToPixiColor(borderColor).color;
    graphic.lineStyle(lineWidth, pixiBorderColor);
  } else {
    graphic.lineStyle(0);
  }

  // 绘制背景矩形
  const pixiFillColor = rgbaToPixiColor(fillColor).color;
  graphic.beginFill(pixiFillColor);
  graphic.drawRect(x, y, width, height);
  graphic.endFill();
};

/**
 * 绘制块文本和背景
 * @param {Object} blockObj - 块对象参数
 * @param {Object} blockObj.actualCenterPoint - 实际中心点坐标
 * @param {string} blockObj.Text - 文本内容
 * @param {Object} blockObj.blockLineConfigure - 块配置
 * @param {PIXI.Graphics} graphic - 图形绘制对象
 * @param {Array} textLst - 文本元素列表
 * @param {boolean} isVisible - 是否可见
 * @param {PIXI.Container} mapContainer - 地图容器
 */
const drawBlockText = (blockObj, graphic, textLst, isVisible, mapContainer) => {
  const { actualCenterPoint, Text, blockLineConfigure } = blockObj;

  const {
    BlockLineWidth,
    BlockLineShowText,
    BlockLineTextColor,
    BlockLineShowBackground,
    BlockLineBackgroundFillColor,
    BlockLineShowBackgroundBorder,
    BlockLineBackgroundBorderColor,
  } = blockLineConfigure;

  // 性能优化：如果文本和背景都不显示，直接返回
  if (!BlockLineShowText && !BlockLineShowBackground) return;

  // 计算字体宽度
  const textStr = JSON.stringify(Text);
  const textLength = getStringLength(textStr);
  const fontWidth = Math.min(
    DEFAULT_CONFIG.FONT_WIDTH_MAX,
    Math.max(DEFAULT_CONFIG.FONT_WIDTH_MIN, Math.floor(8 / textLength))
  );

  // 创建文本元素
  const elementText = new PIXI.Text(Text, {
    fontSize: fontWidth * DEFAULT_CONFIG.FONT_SIZE_MULTIPLIER,
    fill: BlockLineTextColor,
    backgroundColor: "#fff",
  });

  // 设置文本位置和缩放
  elementText.position.set(actualCenterPoint.x, actualCenterPoint.y);
  elementText.scale.set(DEFAULT_CONFIG.SCALE_FACTOR);
  elementText.visible = isVisible && BlockLineShowText;

  // 计算文本中心点（考虑缩放影响）
  const originalScale = 1 / DEFAULT_CONFIG.SCALE_FACTOR;
  elementText.pivot.set(
    (elementText.width * originalScale) / 2,
    (elementText.height * originalScale) / 2
  );

  // 添加到文本列表
  textLst.push(elementText);

  // 绘制背景
  if (BlockLineShowBackground && isVisible) {
    drawTextBackground({
      graphic,
      centerPoint: actualCenterPoint,
      textElement: elementText,
      fillColor: BlockLineBackgroundFillColor,
      borderColor: BlockLineBackgroundBorderColor,
      lineWidth: BlockLineWidth,
      showBorder: BlockLineShowBackgroundBorder,
    });
  }

  // 添加文本到容器
  if (BlockLineShowText) {
    mapContainer.addChild(elementText);
  }
};

/**
 * 绘制块（总段或预组）
 * @param {Object} lineData - 线条数据
 * @param {PIXI.Graphics} graphic - 图形绘制对象
 * @param {Array} textLst - 文本元素列表
 * @param {boolean} isVisible - 是否可见
 * @param {PIXI.Container} mapContainer - 地图容器
 */
const drawBlocks = (lineData, graphic, textLst, isVisible, mapContainer) => {
  const { lineDataLst, blockLineConfigure, mapCenterPoints } = lineData;

  if (!lineDataLst || !Array.isArray(lineDataLst)) return;

  lineDataLst.forEach((val) => {
    const { CenterPoint, OuterPoints, Text } = val;
    if (!CenterPoint) return;

    const { IsEmpty, X, Y } = CenterPoint;
    
    // 计算实际中心点
    const actualCenterPoint = calculateActualPoint({ X, Y }, mapCenterPoints);

    // 绘制虚线连接
    if (!IsEmpty && OuterPoints?.length) {
      const dashedLineLst = OuterPoints.map((item) => [
        actualCenterPoint,
        calculateActualPoint(item, mapCenterPoints)
      ]);
      drawDashedLines(dashedLineLst, graphic);
    }

    // 绘制文本和背景
    drawBlockText(
      {
        actualCenterPoint,
        Text,
        blockLineConfigure,
      },
      graphic,
      textLst,
      isVisible,
      mapContainer
    );
  });
};

/**
 * 创建独立状态的工厂函数
 * @returns {Object} 独立状态对象
 * @property {Array} BlockLayer - 总段图层数组
 * @property {Array} CombLayer - 预组图层数组
 * @property {Array} blockTextLst - 总段文本实例数组
 * @property {Array} combTextLst - 预组文本实例数组
 */
export function createBlockCombState() {
  return {
    BlockLayer: reactive([]),  // 总段图层实例（组件独立）
    CombLayer: reactive([]),   // 预组图层实例（组件独立）
    blockTextLst: reactive([]),// 总段文本实例（组件独立）
    combTextLst: reactive([])  // 预组文本实例（组件独立）
  };
}

/**
 * 绘制总段和预组
 * @param {Object} props - 组件属性
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Object} state - 组件独立状态
 */
export function drawBlockAndCombLines(props, mapContainer, state) {
  const { BlockLayer, CombLayer, blockTextLst, combTextLst } = state;

  // 清空现有图层和文本
  clearList(BlockLayer);
  clearList(CombLayer);
  clearList(blockTextLst);
  clearList(combTextLst);

  // 创建图形图层
  const blockGraphic = createGraphicLayer(BlockLayer, mapContainer, props.feildBlockVisible);
  const combGraphic = createGraphicLayer(CombLayer, mapContainer, props.feildCombVisible);

  // 绘制总段
  if (props.blockInfoLst?.length) {
    const blockObj = { ...props.blockInfoLst[0] };
    drawBlocks(blockObj, blockGraphic, blockTextLst, props.feildBlockVisible, mapContainer);
  }

  // 绘制预组
  if (props.combInfoLst?.length) {
    const combObj = { ...props.combInfoLst[0] };
    drawBlocks(combObj, combGraphic, combTextLst, props.feildCombVisible, mapContainer);
  }
};
