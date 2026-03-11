// 导入所需函数
import { lngLatToMercator, findPolyVisualCenter, createPolygonGraphic } from "./mapUtils";
import { reactive } from "vue";

// 文本样式常量
const TEXT_STYLES = {
  LABEL: {
    fontSize: 40,
    fill: 0x000000,
    backgroundColor: "#fff"
  },
  FIELD: {
    fontFamily: "Arial",
    fontSize: 45,
    fill: 0xffffff,
    align: "center"
  }
};

// 交互相关常量
const INTERACTION_CONFIG = {
  LINE_HEIGHT: 40,
  BORDER_COLOR: 0x30ffff,
  BORDER_WIDTH: 2,
  DEFAULT_LONG: 150,
  OFFSET_X: 600,
  OFFSET_Y: 70,
  ITEM_HEIGHT: 25,
  HEADER_HEIGHT: 80
};

// 布局相关常量
const LAYOUT_CONFIG = {
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  DIALOG_WIDTH: 300,
  MAX_ITEMS: 8
};

/**
 * 销毁文本实例
 * @param {Array} textInstances - 文本实例数组
 */
const destroyTextInstances = (textInstances) => {
  if (textInstances && textInstances.length > 0) {
    textInstances.forEach((item) => {
      if (item.children) {
        item.children.forEach((child) => {
          child.destroy();
        });
      }
      item.destroy();
    });
    textInstances.length = 0;
  }
};

/**
 * 计算地图坐标到像素坐标的转换
 * @param {Array} centerPoint - 中心点坐标
 * @param {Object} mapInfo - 地图信息
 * @returns {Object} 像素坐标
 */
const calculatePosition = (centerPoint, mapInfo) => {
  const picCenter = lngLatToMercator(centerPoint[1], centerPoint[0]);
  return {
    x: picCenter[0] - (mapInfo.Origin?.X || 0),
    y: -(picCenter[1] + (mapInfo.Origin?.Y || 0))
  };
};

/**
 * 创建多行文本容器
 * @param {Array} texts - 文本内容数组
 * @param {number} angle - 旋转角度
 * @returns {PIXI.Container} 文本容器
 */
const createTextContainer = (texts, angle) => {
  const container = new PIXI.Container();
  let maxWidth = 0;

  texts.forEach((text, index) => {
    const textObj = new PIXI.Text(text, TEXT_STYLES.FIELD);
    textObj.x = 0;
    textObj.y = -(index * INTERACTION_CONFIG.LINE_HEIGHT);
    container.addChild(textObj);
    maxWidth = Math.max(textObj.width, maxWidth);
  });

  // 居中每行文本
  container.children.forEach((text) => {
    text.x = -text.width / 2;
  });

  container.rotation = PIXI.DEG_TO_RAD * angle;
  return container;
};

/**
 * 计算对话框位置和连接线信息
 * @param {Object} event - 鼠标事件
 * @param {Object} DialogData - 对话框数据
 * @returns {Object} 更新后的对话框数据
 */
const calculateDialogPosition = (event, DialogData) => {
  const clientX = event.data.originalEvent.clientX;
  const clientY = event.data.originalEvent.clientY;
  DialogData.DialogX = clientX / DialogData.zoomX;
  DialogData.DialogY = clientY / DialogData.zoomY;
  
  let long = INTERACTION_CONFIG.DEFAULT_LONG;
  if (DialogData.DialogX > LAYOUT_CONFIG.MAX_WIDTH - INTERACTION_CONFIG.DEFAULT_LONG - LAYOUT_CONFIG.DIALOG_WIDTH) {
    long = -INTERACTION_CONFIG.DEFAULT_LONG;
  }

  const point1 = { x: DialogData.DialogX, y: DialogData.DialogY };
  const point2 = {
    x: DialogData.DialogX + long,
    y: DialogData.DialogY - INTERACTION_CONFIG.OFFSET_Y
  };
  
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;
  const angle = (360 * Math.atan2(deltaY, deltaX)) / (2 * Math.PI);

  DialogData.lineX = (point1.x + point2.x) / 2;
  DialogData.lineY = (point1.y + point2.y) / 2;
  DialogData.lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  DialogData.lineDeg = angle <= -90 ? 360 + angle : angle;
  
  if (DialogData.DialogX > LAYOUT_CONFIG.MAX_WIDTH - INTERACTION_CONFIG.DEFAULT_LONG - LAYOUT_CONFIG.DIALOG_WIDTH) {
    DialogData.DialogX -= INTERACTION_CONFIG.OFFSET_X;
  }
  
  return DialogData;
};

/**
 * 调整对话框垂直位置
 * @param {Object} DialogData - 对话框数据
 */
const adjustDialogVerticalPosition = (DialogData) => {
  const dataArrLength = 
    DialogData.ClickedMapItems[0]?.DialogData.length ||
    Object.keys(DialogData.ClickedMapItems[0]?.DialogData).length;
  
  if (DialogData.DialogY > LAYOUT_CONFIG.MAX_HEIGHT - LAYOUT_CONFIG.DIALOG_WIDTH) {
    DialogData.DialogY -= 
      (dataArrLength > LAYOUT_CONFIG.MAX_ITEMS ? LAYOUT_CONFIG.MAX_ITEMS : dataArrLength) * 
      INTERACTION_CONFIG.ITEM_HEIGHT + INTERACTION_CONFIG.HEADER_HEIGHT;
  }
};

// 创建独立状态的工厂函数
export function createTextState() {
  return {
    FieldTextsPIXI: reactive([]), // 地图实例（每个组件独立）
    FieldTexts: reactive([]), // 场地文字实例（每个组件独立）
  };
}

/**
 * 绘制场地标签文字
 * @param {Object} props - 组件属性
 * @param {Object} mapInfo - 地图信息
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Object} Map - 地图实例
 * @param {Object} textState - 文本状态
 */
export function drawFieldTexts(props, mapInfo, mapContainer, Map, textState) {
  // 销毁现有文本实例
  destroyTextInstances(textState.FieldTexts);

  // 渲染场地标签
  props.FieldTextInfos.LayerLabelOverlayInfos?.forEach((item) => {
    const Text = new PIXI.Text(item.Label, TEXT_STYLES.LABEL);
    
    // 计算文本位置
    const picCenter = lngLatToMercator(
      Number(item.MapLocation.CenterY),
      Number(item.MapLocation.CenterX)
    );
    
    // 设置文本属性
    Text.anchor.set(0.5, 0.5);
    Text.x = picCenter[0] - mapInfo.Origin?.X;
    Text.y = -(picCenter[1] + mapInfo.Origin?.Y);
    Text.angle = item.MapLocation.Angle;
    
    textState.FieldTexts.push(Text);
    mapContainer.addChild(Text);
  });
  
  Map.render();
}

/**
 * 绘制场地文字
 * @param {Array} arr - 场地数据数组
 * @param {Object} mapInfo - 地图信息
 * @param {PIXI.Container} mapContainer - 地图容器
 * @param {Object} props - 组件属性
 * @param {Array} MapLayer - 地图图层
 * @param {PIXI.Graphics} ClickedMapItemBorder - 点击的地图项边框
 * @param {Object} DialogData - 对话框数据
 * @param {Function} emit - 事件发射器
 * @param {Object} clickEventType - 点击事件类型
 * @param {Object} Map - 地图实例
 * @param {Function} MapLayerPush - 地图图层添加函数
 * @param {Object} textState - 文本状态
 */
export function drawFieldText(
  arr,
  mapInfo,
  mapContainer,
  props,
  MapLayer,
  ClickedMapItemBorder,
  DialogData,
  emit,
  clickEventType,
  Map,
  MapLayerPush,
  textState
) {
  // 销毁现有文本实例
  destroyTextInstances(textState.FieldTextsPIXI);
  
  arr.forEach((item) => {
    // 绘制场地文字
    if (item.text && item.text.length > 0) {
      // 寻找多边形可视中心点
      const centerPoint = findPolyVisualCenter(item.MapPoints);
      const position = calculatePosition(centerPoint, mapInfo);
      
      // 创建文本容器
      const textContainer = createTextContainer(item.text, item.Angle);
      textContainer.position.set(position.x, position.y);
      
      // 添加到地图容器
      textState.FieldTextsPIXI.push(textContainer);
      mapContainer.addChild(textContainer);

      // 处理点击事件
      if (props.fieldClickable && !props.FieldInfos.MapAreaTotalInfos?.length) {
        const flag = MapLayer.filter((it) => it.FieldID === item.FieldID);
        
        const fieldClick = function (event) {
          // 隐藏之前的边框和对话框
          ClickedMapItemBorder.visible = false;
          DialogData.showDialog = false;
          emit("changeShowTransitRecords");
          clickEventType.value = "";

          // 创建新的边框对象，使用统一的createPolygonGraphic函数
const itemBorder = createPolygonGraphic(
  null, // item - 不需要
  flag[flag.length - 1].polygonVertices, // polygonVertices
  null, // mapInfo - 不需要
  { width: INTERACTION_CONFIG.BORDER_WIDTH, color: INTERACTION_CONFIG.BORDER_COLOR }, // borderConfig - 自定义边框配置
  0, // fillColor - 0表示透明，因为只是边框
  0, // transparency - 0表示完全透明
  {
    hasFill: false, // 只绘制边框，不填充
    interactive: false, // 不需要交互
    centerCalculation: false, // 不计算中心
    position: {
      x: flag[flag.length - 1].x, // 使用目标图形的位置
      y: flag[flag.length - 1].y, // 使用目标图形的位置
      angle: flag[flag.length - 1].angle, // 使用目标图形的角度
      scaleX: 1,
      scaleY: 1
    }
  }
);

          // 更新全局边框对象并添加到地图容器中
          ClickedMapItemBorder = itemBorder;
          MapLayerPush(itemBorder);
          mapContainer.addChild(itemBorder);

          // 显示对话框
          DialogData.showDialog = true;

          // 计算对话框位置和连接线信息
          calculateDialogPosition(event, DialogData);

          // 更新对话框数据
          flag[flag.length - 1].DialogData = item?.DialogData;
          DialogData.ClickedMapItems = [flag[flag.length - 1]].map((it) => {
            it.clickEventType = "";
            return it;
          });

          // 调整对话框垂直位置
          adjustDialogVerticalPosition(DialogData);
          
          Map.render();
        };
        
        if (flag[flag.length - 1] && item) {
          flag[flag.length - 1].on("pointerdown", fieldClick);
        }
      }
    }
  });
  
  // 统一渲染
  Map.render();
}