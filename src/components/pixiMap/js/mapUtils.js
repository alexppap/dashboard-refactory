import PolyVisualCenter from "polyvisualcenter";
import { customConfig } from "@/api";

/**
 * 地图工具函数模块
 * 包含地图坐标转换、图形绘制、边界计算、交互检测等工具函数
 */

// ===============================================
// 全局配置和状态
// ===============================================
const ProjectProcessParams = customConfig?.ProjectProcess?.Params;
let projectionsInitialized = false; // 投影转换初始化状态

// 精灵相关常量
const SPRITE_DEFAULT_WIDTH = 100;
const SPRITE_DEFAULT_HEIGHT = 100;

// ===============================================
// 坐标转换相关函数
// ===============================================

/**
 * 初始化投影定义
 * @param {string} sourceProjectionWKT 源投影WKT字符串
 * @param {string} targetProjectionWKT 目标投影WKT字符串
 */
function initializeProjections(sourceProjectionWKT, targetProjectionWKT) {
  if (!projectionsInitialized && typeof proj4 !== "undefined") {
    proj4.defs("sourceProjection", sourceProjectionWKT);
    proj4.defs("targetProjection", targetProjectionWKT);
    projectionsInitialized = true;
  } else if (typeof proj4 === "undefined") {
    console.error("proj4 library is not loaded");
  }
}

/**
 * 将经纬度转换为墨卡托坐标
 * @param {number} longitude 经度
 * @param {number} latitude 纬度
 * @returns {number[]} 转换后的坐标数组
 */
export function lngLatToMercator(longitude, latitude) {
  // 确保输入是有效的数字
  const lon = Number(longitude);
  const lat = Number(latitude);
  
  // 检查是否是有效的数字
  if (isNaN(lon) || isNaN(lat)) {
    console.error("Invalid coordinates: longitude and latitude must be numbers", { longitude, latitude });
    return [0, 0];
  }

  if (typeof proj4 === "undefined") {
    console.error("proj4 library is not loaded");
    return [lon, lat];
  }

  try {
    const result = proj4("sourceProjection", "targetProjection", [lon, lat]);
    
    // 确保结果是有效的数字
    if (isNaN(result[0]) || isNaN(result[1]) || !isFinite(result[0]) || !isFinite(result[1])) {
      // console.error("Invalid projection result: coordinates must be finite numbers", { result });
      return [0, 0];
    }
    
    return result;
  } catch (error) {
    console.error("Failed to convert coordinates", error);
    return [0, 0];
  }
}

// ===============================================
// 图形绘制相关函数
// ===============================================

/**
 * 绘制虚线多边形
 * @param {object} mapElement 地图元素对象
 * @param {number[]} polygonVertices 多边形顶点数组
 * @param {number} dashSize 虚线长度
 */
export function drawDashedPolygon(mapElement, polygonVertices, dashSize) {
  if (!mapElement || !polygonVertices || !Array.isArray(polygonVertices)) {
    console.error("Invalid parameters for drawDashedPolygon");
    return;
  }

  if (typeof dashSize !== "number" || dashSize <= 0) {
    console.error("Invalid dash size: must be a positive number");
    return;
  }

  for (let i = 0; i < polygonVertices.length; i += 2) {
    const x1 = polygonVertices[i];
    const y1 = polygonVertices[i + 1];
    const x2 = polygonVertices[(i + 2) % polygonVertices.length];
    const y2 = polygonVertices[(i + 3) % polygonVertices.length];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dashCount = Math.floor(distance / dashSize);

    if (dashCount === 0) continue;

    const xIncrement = dx / dashCount;
    const yIncrement = dy / dashCount;
    let currentX = x1;
    let currentY = y1;

    for (let j = 0; j < dashCount; j++) {
      if (j % 2 === 0) {
        mapElement.moveTo(currentX, currentY);
      } else {
        mapElement.lineTo(currentX, currentY);
      }

      currentX += xIncrement;
      currentY += yIncrement;
    }
  }
}



// ===============================================
// 交互检测相关函数
// ===============================================

/**
 * 点击穿透检测
 * @param {object[]} container 容器元素数组
 * @param {object} point 点坐标 {x, y}
 * @returns {object[]} 命中的元素数组
 */
export function clickThroughTest(container, point) {
  if (!container || !Array.isArray(container) || !point) {
    console.error("Invalid parameters for clickThroughTest");
    return [];
  }

  const hitElements = [];

  function traverseChildren(parent) {
    parent.forEach((child) => {
      if (
        child?.containsPoint &&
        typeof child.containsPoint === "function" &&
        child.containsPoint(point)
      ) {
        hitElements.push(child);
      }
    });
  }

  traverseChildren(container);
  return hitElements;
}

// ===============================================
// 坐标系和变换相关函数
// ===============================================

/**
 * 重置坐标系
 * @param {object[]} arr 点数组
 * @param {object} mapInfo 地图信息
 * @param {object} angle 角度对象
 * @param {object} props 属性对象
 * @param {object} scale 缩放对象
 * @param {object} originPositionX 原始X位置对象
 * @param {object} originPositionY 原始Y位置对象
 * @param {object} mapContainer 地图容器
 * @param {object} originScale 原始缩放对象
 */
export function resetCoordinateSystem(
  arr,
  mapInfo,
  angle,
  props,
  scale,
  originPositionX,
  originPositionY,
  mapContainer,
  originScale
) {
  // 定义投影转换
  proj4.defs("sourceProjection", mapInfo.SourceProjectionWKT);
  proj4.defs("targetProjection", mapInfo.TargetProjectionWKT);

  // 计算容器外接矩形的四个坐标点
  const containerPoints = [
    { X: 0, Y: 0 },
    { X: mapInfo.MapWidth, Y: 0 },
    { X: 0, Y: mapInfo.MapHeight },
    { X: mapInfo.MapWidth, Y: mapInfo.MapHeight },
  ];

  // 对容器进行旋转
  const rotateContainer = rotateXY(containerPoints, angle, mapInfo);

  // 计算旋转后的外接矩形
  let bigSquare = {
    minX: rotateContainer[0].X,
    maxX: rotateContainer[0].X,
    minY: rotateContainer[0].Y,
    maxY: rotateContainer[0].Y,
    width: 0,
    height: 0,
  };

  rotateContainer?.forEach((point) => {
    if (point.X > bigSquare.maxX) bigSquare.maxX = point.X;
    if (point.X < bigSquare.minX) bigSquare.minX = point.X;
    if (point.Y > bigSquare.maxY) bigSquare.maxY = point.Y;
    if (point.Y < bigSquare.minY) bigSquare.minY = point.Y;
  });

  bigSquare.width = bigSquare.maxX - bigSquare.minX;
  bigSquare.height = bigSquare.maxY - bigSquare.minY;

  // 如果宽度和高度都大于零，执行缩放操作
  if (bigSquare.width > 0 && bigSquare.height > 0) {
    const deg1 = Math.PI * (-angle.value / 180);

    const rotatedPoints = arr.map((p) => ({
      x: p.X * Math.cos(deg1) - p.Y * Math.sin(deg1),
      y: p.X * Math.sin(deg1) + p.Y * Math.cos(deg1),
    }));

    // 找到旋转后的边界
    const xMax = Math.max(...rotatedPoints.map((p) => p.x));
    const yMax = Math.max(...rotatedPoints.map((p) => p.y));
    const xMin = Math.min(...rotatedPoints.map((p) => p.x));
    const yMin = Math.min(...rotatedPoints.map((p) => p.y));

    // 计算旋转后的宽度和高度
    const MapWidth = xMax - xMin;
    const MapHeight = yMax - yMin;

    // 设置缩放比例
    const scale1 =
      (props.mapObj.MapWidth / MapWidth) *
      (props.NowShowViewName && props.NowShowViewName?.indexOf("新扬子") != -1
        ? 1.055
        : 0.9);
    const scale2 =
      ((props.mapObj.MapHeight * props.mapHeightZoom) / MapHeight) *
      (props.NowShowViewName && props.NowShowViewName?.indexOf("新扬子") != -1
        ? 1.055
        : 0.9);

    scale.value = props.mapObj.defaultScale
      ? props.mapObj.defaultScale
      : Math.min(scale1, scale2);
    
    // 计算新的地图中心点信息
    const oldCenterX = mapInfo.MapWidth / 2;
    const oldCenterY = mapInfo.MapHeight / 2;
    const num = -angle.value / 180;
    const deg = Math.PI * num;
    const newCenterX = oldCenterX * Math.cos(deg) - oldCenterY * Math.sin(deg);
    const newCenterY = oldCenterX * Math.sin(deg) + oldCenterY * Math.cos(deg);

    // 更新位置和缩放信息（修复核心：重写mapScaleHull计算逻辑）
    if (!props.isHull) {
      originPositionX.value =
        props.mapObj.MapWidth / 2 - newCenterX * scale.value;
      originPositionY.value =
        (props.mapHeightZoom * props.mapObj.MapHeight) / 2 -
        newCenterY * scale.value;
    } else {
      // 船体图设置默认缩放比例 - 重构后的逻辑
      let mapScaleHull;
      const hullHeight = mapInfo.MapHeight; // 船体图高度
      const canvasHeight = props.mapObj.MapHeight; // 画布高度
      const hullWidth = mapInfo.MapWidth; // 船体图宽度
      const canvasWidth = props.mapObj.MapWidth; // 画布宽度
      // console.log('hullHeight', hullHeight)
      // console.log('canvasHeight', canvasHeight)
      // console.log('hullWidth', hullWidth)
      // console.log('canvasWidth', canvasWidth)
      // 判断：如果船体图的高度大于画布的高度，则以双方的宽度来进行缩放
      if (hullHeight > hullWidth||Math.abs(hullHeight - hullWidth)<50) {
        // 以宽度比例计算缩放值（保证宽度铺满画布）
        mapScaleHull = canvasWidth / hullWidth;
        
        // originPositionX.value -= newCenterX * mapScaleHull;
        // originPositionY.value -= newCenterY * mapScaleHull;
        // X轴：水平居中（保证宽度铺满）
        originPositionX.value =
        props.mapObj.MapWidth / 2 - newCenterX * scale.value + (mapInfo.MapWidth * scale.value) / 2;
        // Y轴：垂直向上对齐（画布顶部对齐船体图顶部）
      originPositionY.value =
        props.mapObj.MapHeight / 2 - newCenterY * scale.value + (mapInfo.MapHeight * mapScaleHull) / 2;
      } else {
        // 反之则用宽度比例和高度比例比较，选择缩放值（保证完整显示）
        const widthRatio = canvasWidth / hullWidth;
        const heightRatio = canvasHeight / hullHeight;
        // 选择较小的缩放比例，确保船体图能完整显示在画布内
        mapScaleHull = Math.min(widthRatio, heightRatio);

        // 常规居中定位
        originPositionX.value =
          canvasWidth / 2 - newCenterX * mapScaleHull + (hullWidth * mapScaleHull) / 2;
        originPositionY.value =
          canvasHeight / 2 - newCenterY * mapScaleHull + (hullHeight * mapScaleHull) / 2;
      }

      // 保留1位小数
      mapScaleHull = Number(mapScaleHull.toFixed(1));
      scale.value = mapScaleHull;

      // ===== 额外优化：确保画布内地图尽可能铺满 =====
      // 如果需要轻微放大以完全铺满（避免边缘留白），可取消下面注释
      // scale.value = mapScaleHull * 1.01;
      // mapScaleHull = scale.value;
    }
    
    mapContainer.angle = -angle.value;
    mapContainer.scale.set(scale.value);
    originScale.value = scale.value;
    mapContainer.position.set(originPositionX.value, originPositionY.value);
  }
}

/**
 * 角度转弧度
 * @param {number} angle 角度
 * @returns {number} 弧度
 */
function angleToRadian(angle) {
  return Math.PI * (angle / 180);
}

/**
 * 旋转坐标点
 * @param {number} x 点X坐标
 * @param {number} y 点Y坐标
 * @param {number} centerX 旋转中心X坐标
 * @param {number} centerY 旋转中心Y坐标
 * @param {number} angle 旋转角度（度）
 * @returns {object} 旋转后的点 {x, y}
 */
function rotatePoint(x, y, centerX, centerY, angle) {
  const radian = angleToRadian(-angle);
  const deltaX = x - centerX;
  const deltaY = y - centerY;

  return {
    x: deltaX * Math.cos(radian) - deltaY * Math.sin(radian) + centerX,
    y: deltaX * Math.sin(radian) + deltaY * Math.cos(radian) + centerY,
  };
}

/**
 * 处理旋转坐标
 * @param {object[]} points 点数组
 * @param {object} angle 角度对象
 * @param {object} mapInfo 地图信息
 * @returns {object[]} 旋转后的点数组
 */
function rotateXY(lst, angle, mapInfo) {
  let num = -angle.value / 180;
  let deg = Math.PI * num;
  let centerInfo = { X: mapInfo.MapWidth / 2, Y: mapInfo.MapHeight / 2 };
  return lst.map((point) => {
    const { X, Y } = point;
    const deltaX = X - centerInfo.X;
    const deltaY = Y - centerInfo.Y;

    point.X = deltaX * Math.cos(deg) - deltaY * Math.sin(deg) + centerInfo.X;
    point.Y = deltaX * Math.sin(deg) + deltaY * Math.cos(deg) + centerInfo.Y;

    return point;
  });
}

// ===============================================
// 几何计算相关函数
// ===============================================

/**
 * 获取字符串长度（考虑中英文）
 * @param {string} str 输入字符串
 * @returns {number} 计算后的长度
 */
export function getStringLength(str) {
  if (typeof str !== "string") {
    console.error("getStringLength requires a string parameter");
    return 0;
  }

  let realLength = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    // ASCII字符计为0.5，其他字符计为1
    realLength += charCode >= 0 && charCode <= 128 ? 0.5 : 1;
  }
  return realLength;
}

/**
 * 寻找多边形重心
 * @param {object[]} points 多边形顶点数组
 * @returns {number[]} 重心坐标 [x, y]
 */
export function findPolygonCentroid(points) {
  if (!points || !Array.isArray(points) || points.length === 0) {
    console.error("Invalid points for findPolygonCentroid");
    return [0, 0];
  }

  const n = points.length;
  let area = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let i = 0; i < n; i++) {
    const point1 = points[i];
    const point2 = points[(i + 1) % n];
    const crossProduct = point1.X * point2.Y - point2.X * point1.Y;

    area += crossProduct;
    centroidX += (point1.X + point2.X) * crossProduct;
    centroidY += (point1.Y + point2.Y) * crossProduct;
  }

  area *= 0.5;
  if (area === 0) return [0, 0]; // 防止除以零

  centroidX /= 6 * area;
  centroidY /= 6 * area;

  return [centroidX, centroidY];
}

/**
 * 计算路径总长度
 * @param {object[]} points 路径点数组
 * @returns {number} 路径总长度
 */
export function calculatePathLength(points) {
  if (!points || !Array.isArray(points) || points.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }
  return totalDistance;
}

/**
 * 获取路径上指定距离的点
 * @param {object[]} points 路径点数组
 * @param {number} distance 指定距离
 * @returns {object} 路径上的点 {x, y}
 */
export function getPointAtDistance(points, distance) {
  if (
    !points ||
    !Array.isArray(points) ||
    points.length === 0 ||
    typeof distance !== "number"
  ) {
    console.error("Invalid parameters for getPointAtDistance");
    return null;
  }

  if (points.length === 1) return points[0];

  let currentDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const segmentDistance = Math.sqrt(dx * dx + dy * dy);

    // 如果距离在当前线段内
    if (currentDistance + segmentDistance >= distance) {
      const t = (distance - currentDistance) / segmentDistance;
      return {
        x: points[i].x + t * dx,
        y: points[i].y + t * dy,
      };
    }

    currentDistance += segmentDistance;
  }

  // 如果超过总距离，返回终点
  return points[points.length - 1];
}

/**
 * 将地图视角对准路径并调整到合适的缩放级别
 * @param {object} mapConfigParams 地图配置参数
 * @param {object} mapInfo 地图信息
 * @param {object} mapContainer 地图容器
 * @param {object} scale 缩放对象
 * @param {object} props 属性对象
 */
export function fitPathToView(
  mapConfigParams,
  mapInfo,
  mapContainer,
  scale, 
  props
) {
  if (!mapInfo || !mapContainer || !scale || !props) {
    console.error("Missing required parameters for fitPathToView");
    return;
  }
  // 转换坐标点
  const points = props.map((coordStr) => {
    const [lng, lat] = coordStr.split(",").map(Number);
    const mercator = lngLatToMercator(lng, lat);

    return {
      x:
        mercator[0] -
        (mapInfo.Origin?.X || 0) +
        (mapConfigParams?.routerOffsetX || 0),
      y: -(
        mercator[1] +
        (mapInfo.Origin?.Y || 0) +
        (mapConfigParams?.routerOffsetY || 0)
      ),
    };
  });

  // 计算路径的边界框
  const bounds = calculateBoundsFrom2DPoints(points);
  // 获取地图容器尺寸
  const containerWidth = mapContainer.width || 800;
  const containerHeight = mapContainer.height || 600;
  // 计算适合的缩放比例
  const padding = 50;
  const scaleX =
    (containerWidth - padding * 2) / (bounds.maxX - bounds.minX || 1);
  const scaleY =
    (containerHeight - padding * 2) / (bounds.maxY - bounds.minY || 1);
  let newScale = Math.min(scaleX, scaleY);

  // 限制最大缩放
  if (newScale > 2.5) {
    newScale = 2.5;
  }

  // 计算地图中心位置
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  // 应用缩放和位置调整
  scale.value = newScale;
  mapContainer.scale.set(newScale);
  if (mapContainer.pivot?.set) {
    mapContainer.pivot.set(centerX, centerY);
  }
  mapContainer?.position.set(containerWidth / 2, containerHeight / 2);
  // 触发地图重绘（假设Map全局可用）
  if (typeof Map !== "undefined" && Map.render) {
    Map.render();
  }
}

/**
 * 寻找多边形的视觉中心
 * @param {object[]} mapPoints 多边形顶点数组
 * @returns {number[]} 视觉中心坐标 [x, y]
 */
export function findPolyVisualCenter(mapPoints) {
  if (!mapPoints || !Array.isArray(mapPoints) || mapPoints.length === 0) {
    console.error("Invalid points for findPolyVisualCenter");
    return [0, 0];
  }

  // 转换数组格式
  const pointsTransfer = mapPoints.map((point) => [point.X, point.Y]);
  const result = PolyVisualCenter(pointsTransfer, 1.0);

  if (!result?.poles?.[0]) {
    console.warn("Could not calculate polygon visual center");
    return [0, 0];
  }

  return [
    Number(result.poles[0].poleX) || 0,
    Number(result.poles[0].poleY) || 0,
  ];
}

// ===============================================
// 颜色处理相关函数
// ===============================================

/**
 * 将RGBA颜色转换为Pixi格式
 * @param {string} rgbaString RGBA颜色字符串
 * @returns {object} Pixi颜色对象 {color, alpha}
 */
export function rgbaToPixiColor(rgbaString) {
  if (typeof rgbaString !== "string") {
    console.error("rgbaToPixiColor requires a string parameter");
    return { color: 0, alpha: 1 };
  }

  try {
    const parts = rgbaString
      .replace(/^rgba\(|\)$/g, "")
      .split(",")
      .map((part) => part.trim());
    const r = Math.min(255, Math.max(0, parseInt(parts[0], 10) || 0));
    const g = Math.min(255, Math.max(0, parseInt(parts[1], 10) || 0));
    const b = Math.min(255, Math.max(0, parseInt(parts[2], 10) || 0));
    const a = Math.min(1, Math.max(0, parseFloat(parts[3]) || 1));

    const color = (r << 16) | (g << 8) | b;
    return { color, alpha: a };
  } catch (error) {
    console.error("Failed to parse rgba color:", error);
    return { color: 0, alpha: 1 };
  }
}

/**
 * 绘制虚线
 * @param {object[]} dashedLineList 虚线列表
 * @param {object} graphic 绘图对象
 */
export function drawDashedLines(dashedLineList, graphic) {
  if (!dashedLineList || !Array.isArray(dashedLineList) || !graphic) {
    console.error("Invalid parameters for drawDashedLines");
    return;
  }

  const lineWidth = 0.5;
  const lineColor = 0x49555a;
  const dashLength = 2;
  const gapLength = 1;

  dashedLineList.forEach((line) => {
    if (!line || line.length < 2) return;

    const { x: x1, y: y1 } = line[0];
    const { x: x2, y: y2 } = line[1];

    // 计算总长度和方向向量
    const totalLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (totalLength <= 0) return;

    const deltaX = (x2 - x1) / totalLength;
    const deltaY = (y2 - y1) / totalLength;

    graphic.lineStyle(lineWidth, lineColor);

    let currentLength = 0;
    while (currentLength < totalLength) {
      const startX = x1 + deltaX * currentLength;
      const startY = y1 + deltaY * currentLength;

      currentLength += dashLength;
      const isOver = currentLength > totalLength;
      const endLength = isOver ? totalLength : currentLength;

      const endX = x1 + deltaX * endLength;
      const endY = y1 + deltaY * endLength;

      graphic.moveTo(startX, startY);
      graphic.lineTo(endX, endY);

      if (isOver) break;

      currentLength += gapLength;
    }
  });
}

// ===============================================
// 边界计算相关函数
// ===============================================

/**
 * 计算2D点集的边界框
 * @param {object[]} points 点数组 {x, y}
 * @returns {object} 边界框 {minX, minY, maxX, maxY}
 */
function calculateBoundsFrom2DPoints(points) {
  if (!points || !Array.isArray(points) || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );
}

/**
 * 计算点集的边界框（使用X, Y属性）
 * @param {object[]} points 点数组 {X, Y}
 * @returns {object} 边界框 {minX, minY, maxX, maxY, width, height}
 */
function calculateBoundsFromPoints(points) {
  if (!points || !Array.isArray(points) || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const bounds = points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.X),
      minY: Math.min(acc.minY, point.Y),
      maxX: Math.max(acc.maxX, point.X),
      maxY: Math.max(acc.maxY, point.Y),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );

  return {
    ...bounds,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

/**
 * 通用的边界框计算函数
 * @param {object[]} points 点数组
 * @param {object} options 配置选项
 * @param {string} options.xKey x坐标属性名，默认"x"
 * @param {string} options.yKey y坐标属性名，默认"y"
 * @param {boolean} options.includeCenter 是否包含中心点，默认false
 * @returns {object} 边界框信息
 */
export function calculateBounds(points, options = {}) {
  const {
    xKey = "x", // 可以指定x坐标的属性名
    yKey = "y", // 可以指定y坐标的属性名
    includeCenter = false, // 是否计算中心点
  } = options;

  if (!points || points.length === 0) {
    const result = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return includeCenter ? { ...result, centerX: 0, centerY: 0 } : result;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach((point) => {
    minX = Math.min(minX, point[xKey]);
    maxX = Math.max(maxX, point[xKey]);
    minY = Math.min(minY, point[yKey]);
    maxY = Math.max(maxY, point[yKey]);
  });

  const result = { minX, minY, maxX, maxY };

  if (includeCenter) {
    return {
      ...result,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  return result;
}

// ===============================================
// 图形元素创建相关函数
// ===============================================

/**
 * 处理多边形顶点去重和转换
 * @param {object[]} points 多边形顶点数组
 * @param {number} centerX 中心点X坐标
 * @param {number} centerY 中心点Y坐标
 * @returns {number[]} 处理后的多边形顶点数组
 */
export function processPolygonVertices(points, centerX, centerY) {
  const polygonVertices = [];

  points.forEach((point, i) => {
    // 去重操作
    if (i === 0 || JSON.stringify(point) !== JSON.stringify(points[i - 1])) {
      polygonVertices.push(point.X - centerX);
      polygonVertices.push(-(point.Y - centerY));
    }
  });

  return polygonVertices;
}

// 公共工具函数：创建图形对象
export function createPolygonGraphic(
  item,
  polygonVertices,
  mapInfo,
  borderConfig,
  fillColor,
  transparency = 1,
  options = {}
) {
  const graphic = new PIXI.Graphics();
  const { 
    hasBorder = true, 
    borderWidth = 1, 
    borderColor = 0x000000, 
    hasFill = true, 
    interactive = true,
    centerCalculation = true,
    position = null
  } = options;

  // 设置边框
  if (hasBorder && borderConfig === 1) {
    graphic.lineStyle(borderWidth, borderColor, 1);
  } else if (hasBorder && typeof borderConfig === 'object') {
    // 支持自定义边框配置
    graphic.lineStyle(borderConfig.width, borderConfig.color, borderConfig.alpha || 1);
  }

  // 设置位置和变换
  if (position) {
    // 直接使用提供的位置
    graphic.x = position.x || 0;
    graphic.y = position.y || 0;
    graphic.angle = position.angle || 0;
    graphic.scale.x = position.scaleX || 1;
    graphic.scale.y = position.scaleY || 1;
  } else if (centerCalculation && item && mapInfo) {
    // 计算中心坐标
    const picCenter = lngLatToMercator(
      Number(item.CenterY),
      Number(item.CenterX)
    );

    graphic.x = picCenter[0] - mapInfo.Origin?.X;
    graphic.y = -(picCenter[1] + mapInfo.Origin?.Y);
    graphic.angle = item.Angle;
    graphic.scale.x = mapInfo.Scale
      ? item.Mirror
        ? -mapInfo.Scale
        : mapInfo.Scale
      : 1;
    graphic.scale.y = mapInfo.Scale || 1;
  }

  // 填充颜色
  if (hasFill) {
    graphic.beginFill(fillColor, transparency);
    graphic.drawPolygon(polygonVertices);
    graphic.endFill();
  } else {
    // 只绘制线条
    graphic.drawPolygon(polygonVertices);
  }

  // 设置交互属性
  if (interactive) {
    graphic.interactive = true;
    graphic.buttonMode = true;
  }

  // 设置公共属性
  if (item) {
    graphic.RefObjectID = item.RefObjectID;
    graphic.RefObjectType = item.RefObjectType;
    graphic.MyAngle = item.Angle;
    graphic.MyMirror = item.Mirror;
  }
  
  // 始终保存多边形顶点
  graphic.MyPolygonVertices = polygonVertices;
  graphic.FillColor = fillColor;

  return graphic;
}

// 公共工具函数：创建精灵
export function createSprite(item, resources, mapInfo) {
  // 确保item对象有必要的属性
  if (!item || !resources || !mapInfo) {
    console.error("Missing required parameters for createSprite");
    return null;
  }
  
  // 确保ImageID存在且有效
  if (!item.ImageID || !resources[item.ImageID] || !resources[item.ImageID].texture) {
    console.error("Invalid texture resource for createSprite", { item });
    return null;
  }
  
  const texture = resources[item.ImageID]["texture"];
  const sprite = new PIXI.Sprite(texture);
  
  // 确保CenterY和CenterX是有效的数字
  const centerY = Number(item.CenterY);
  const centerX = Number(item.CenterX);
  
  // 使用lngLatToMercator转换坐标，该函数已经有错误处理
  // 修复：参数顺序应该是(lng, lat)，即(centerX, centerY)
  const picCenter = lngLatToMercator( centerY,centerX);
  
  // 设置位置和尺寸，确保使用有效的数值
  const originX = Number(mapInfo.Origin?.X || 0);
  const originY = Number(mapInfo.Origin?.Y || 0);
  
  sprite.x = picCenter[0] - originX;
  sprite.y = -(picCenter[1] + originY);
  
  // 确保宽度和高度是有效的数字
  
  
  sprite.anchor.set(0.5, 0.5);

  // 设置缩放和旋转，确保使用有效的数值
  const mapScale = typeof mapInfo.Scale === "number" ? mapInfo.Scale : 1;
  const mirror = !!item.Mirror;
  
  sprite.scale.x = mirror ? -mapScale : mapScale;
  sprite.scale.y = mapScale;

  sprite.width = typeof item.Length === "number" ? item.Length : 10;
  sprite.height = typeof item.Width === "number" ? item.Width : 10;

  sprite.angle = typeof item.Angle === "number" ? item.Angle : 0;

  // 设置交互属性
  sprite.RefObjectID = item.RefObjectID || "";
  sprite.Name = item.Name || "";
  sprite.interactive = true;
  sprite.buttonMode = true;

  return sprite;
}

/**
 * 获取高对比度RGBA颜色
 * @param {string|Array} originalRGBA 原始RGBA颜色（字符串或数组）
 * @returns {string} 高对比度RGBA颜色字符串
 */
export function getHighContrastRGBA(originalRGBA) {
  // 解析原始RGBA（支持字符串如"rgba(255,0,255,1)"或数组[r,g,b,a]）
  let r, g, b, a;
  if (typeof originalRGBA === "string") {
    const match = originalRGBA.match(
      /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/
    );
    if (!match) throw new Error("无效的RGBA格式");
    [, r, g, b, a] = match.map(Number);
  } else if (Array.isArray(originalRGBA) && originalRGBA.length === 4) {
    [r, g, b, a] = originalRGBA;
  } else {
    throw new Error("输入格式应为RGBA字符串或数组");
  }

  // 辅助函数：计算颜色的相对亮度（0-1范围）
  const getRelativeLuminance = (r, g, b) => {
    const [R, G, B] = [r, g, b].map((c) => {
      const val = c / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };

  // 计算反色
  const invertedR = 255 - r;
  const invertedG = 255 - g;
  const invertedB = 255 - b;

  // 计算原始色和反色的相对亮度
  const originalLum = getRelativeLuminance(r, g, b);
  const invertedLum = getRelativeLuminance(invertedR, invertedG, invertedB);

  // 计算亮度比（确保分子大于分母）
  const contrastRatio =
    originalLum > invertedLum
      ? (originalLum + 0.05) / (invertedLum + 0.05)
      : (invertedLum + 0.05) / (originalLum + 0.05);

  // 若反色对比度足够（≥4.5），则使用反色；否则用黑白对比
  if (contrastRatio >= 4.5) {
    return `rgba(${invertedR}, ${invertedG}, ${invertedB}, ${a})`;
  } else {
    // 原始色偏亮（亮度>0.5）用黑色，否则用白色
    return originalLum > 0.5
      ? `rgba(0, 0, 0, ${a})`
      : `rgba(255, 255, 255, ${a})`;
  }
}

export const  positionJson = {
  "frames": {
    "frame1": {
      "frame": { "x": 0, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame2": {
      "frame": { "x": 60, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame3": {
      "frame": { "x": 120, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame4": {
      "frame": { "x": 180, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame5": {
      "frame": { "x": 240, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame6": {
      "frame": { "x": 300, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame7": {
      "frame": { "x": 360, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame8": {
      "frame": { "x": 420, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame9": {
      "frame": { "x": 480, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame10": {
      "frame": { "x": 540, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame11": {
      "frame": { "x": 600, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame12": {
      "frame": { "x": 660, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame13": {
      "frame": { "x": 720, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame14": {
      "frame": { "x": 780, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame15": {
      "frame": { "x": 840, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame16": {
      "frame": { "x": 900, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame17": {
      "frame": { "x": 960, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame18": {
      "frame": { "x": 1020, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame19": {
      "frame": { "x": 1080, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame20": {
      "frame": { "x": 1140, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame21": {
      "frame": { "x": 1200, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame22": {
      "frame": { "x": 1260, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame23": {
      "frame": { "x": 1320, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame24": {
      "frame": { "x": 1380, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame25": {
      "frame": { "x": 1440, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame26": {
      "frame": { "x": 1500, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame27": {
      "frame": { "x": 1560, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame28": {
      "frame": { "x": 1620, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame29": {
      "frame": { "x": 1680, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame30": {
      "frame": { "x": 1740, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame31": {
      "frame": { "x": 1800, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame32": {
      "frame": { "x": 1860, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame33": {
      "frame": { "x": 1920, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame34": {
      "frame": { "x": 1980, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame35": {
      "frame": { "x": 2040, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame36": {
      "frame": { "x": 2100, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame37": {
      "frame": { "x": 2160, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame38": {
      "frame": { "x": 2220, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame39": {
      "frame": { "x": 2280, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame40": {
      "frame": { "x": 2340, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame41": {
      "frame": { "x": 2400, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame42": {
      "frame": { "x": 2460, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame43": {
      "frame": { "x": 2520, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame44": {
      "frame": { "x": 2580, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame45": {
      "frame": { "x": 2640, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame46": {
      "frame": { "x": 2700, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame47": {
      "frame": { "x": 2760, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame48": {
      "frame": { "x": 2820, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame49": {
      "frame": { "x": 2880, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame50": {
      "frame": { "x": 2940, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame51": {
      "frame": { "x": 3000, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame52": {
      "frame": { "x": 3060, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame53": {
      "frame": { "x": 3120, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame54": {
      "frame": { "x": 3180, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame55": {
      "frame": { "x": 3240, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame56": {
      "frame": { "x": 3300, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame57": {
      "frame": { "x": 3360, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame58": {
      "frame": { "x": 3420, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame59": {
      "frame": { "x": 3480, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    },
    "frame60": {
      "frame": { "x": 3540, "y": 0, "w": 60, "h": 30 },
      "sourceSize": { "w": 60, "h": 30 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 60, "h": 30 }
    }
  },
  "meta": {
    "app": "https://www.codeandweb.com/texturepacker",
    "version": "1.0",
    "image": "position.png",
    "format": "RGBA8888",
    "size": { "w": 3600, "h": 30 },
    "scale": "1"
  }
}