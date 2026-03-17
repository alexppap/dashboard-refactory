<template>
  <!-- 对话框连接线 -->
  <div
    v-show="DialogData.showDialog"
    class="dialogLine"
    :style="{
      zIndex: 99,
      left: `${
        DialogData.lineX -
        DialogData.lineLength / 2 +
        30 -
        (mapObj.OffsetX ? mapObj.OffsetX : 0)
      }px`,
      top: `${
        DialogData.lineY -
        (mapObj.MapHeight - 1125) -
        (mapObj.OffsetY ? mapObj.OffsetY : 0)
      }px`,
      width: `${DialogData.lineLength - 5}px`,
      transform: `rotate(${DialogData.lineDeg}deg)`,
      height: '2px',
    }"
  ></div>
  <!-- 对话框主体 -->
  <div
    v-show="DialogData.showDialog"
    ref="dialogRef"
    id="dialog"
    :style="{
      zIndex: 99,
      left: `${
        DialogData.DialogX + 175 - (mapObj.OffsetX ? mapObj.OffsetX : 0)
      }px`,
      top: `${
        DialogData.DialogY -
        70 -
        (mapObj.MapHeight - 1125) -
        (mapObj.OffsetY ? mapObj.OffsetY : 0)
      }px`,
    }"
  >
    <div v-show="clickEventType === 'PBS' && DialogData.showDialog">
      <div class="dialogHeader">
        <div>{{ modalTitle }}</div>
        <CloseOutlined style="color: #999999" @click="DialogData.closeDialog" />
      </div>
      <a-row
        v-for="Item in DialogData.ClickedMapItems"
        :key="Item.FieldID"
        :style="{ background: Item.BackgroundColor, padding: '5px 0 15px 0' }"
      >
        <!-- 插槽内容 -->
        <slot :data="Item"></slot>
      </a-row>
    </div>

    <div v-show="clickEventType === 'Material' && DialogData.showDialog">
      <div class="dialogHeader2">
        <div>{{ modalTitle }}</div>
        <CloseOutlined style="color: #999999" @click="DialogData.closeDialog" />
      </div>
      <a-row
        v-for="Item in DialogData.ClickedMapItems"
        :key="Item.MaterialID"
        :style="{ background: Item.BackgroundColor, padding: '5px 0 15px 0' }"
      >
        <!-- 插槽内容 -->
        <slot :data="Item"></slot>
      </a-row>
    </div>

    <div v-show="clickEventType === 'ShipSprites' && DialogData.showDialog">
      <slot
        :shipNoTitle="shipNoTitle"
        :modalTitle="modalTitle"
        :DialogData="DialogData"
        name="Header"
      ></slot>
      <div v-if="!$slots.Header" class="dialogHeader3">
        <div>
          <i
            class="iconfont icon-chuanboxinxi iconBlue"
            style="font-size: 20px; margin-right: 10px"
          ></i
          ><span style="margin-right: 20px">{{ shipNoTitle }}</span
          ><span>{{ modalTitle }}</span>
        </div>
        <CloseOutlined style="color: #999999" @click="DialogData.closeDialog" />
      </div>
      <a-row
        v-for="Item in DialogData.ClickedMapItems"
        :key="Item.ShipID"
        :style="{ background: 'rgba(8, 24, 53, 0.3)', padding: '5px 0 15px 0' }"
      >
        <!-- 插槽内容 -->
        <slot :data="Item"></slot>
      </a-row>
    </div>

    <div
      v-show="clickEventType === 'DepartmentSprites' && DialogData.showDialog"
    >
      <slot
        :shipNoTitle="shipNoTitle"
        :modalTitle="modalTitle"
        :DialogData="DialogData"
        name="DepartmentHeader"
      ></slot>
      <a-row
        v-for="(Item, i) in DialogData.ClickedMapItems"
        :key="i"
        :style="{ background: 'rgba(8, 24, 53, 0.3)', padding: '5px 0 15px 0' }"
      >
        <!-- 插槽内容 -->
        <slot :data="Item"></slot>
      </a-row>
    </div>

    <div v-show="clickEventType === 'Field' && DialogData.showDialog">
      <div
        style="
          left: -5px;
          top: 0px;
          position: absolute;
          width: 15px;
          height: 15px;
          background: linear-gradient(180deg, #008bff 4%, #30ffff 100%);
          clip-path: polygon(0 0, 0 100%, 100% 0);
        "
      ></div>
      <div
        style="
          right: -5px;
          top: 0px;
          position: absolute;
          transform: rotate(180deg);
          width: 15px;
          height: 15px;
          background: linear-gradient(180deg, #30ffff 4%, #008bff 100%);
          clip-path: polygon(0 100%, 0 0, 100% 100%);
        "
      ></div>
      <a-row
        v-for="Item in DialogData.ClickedMapItems"
        :key="Item.FieldID"
        :gutter="[10, 10]"
        style="
          background: rgba(6, 41, 71, 0.85);
          border: 1px solid #30ffff;
          clip-path: polygon(
            20px 0,
            calc(100% - 20px) 0,
            100% 20px,
            100% calc(100% - 20px),
            calc(100% - 20px) 100%,
            20px 100%,
            0 calc(100% - 20px),
            0 20px
          );
        "
        :style="{ padding: '5px 0 15px 0' }"
      >
        <div
          style="
            position: absolute;
            left: -5px;
            top: 0px;
            width: 21px;
            height: 21px;
            background: #30ffff;
            clip-path: polygon(0 0, 0 100%, 100% 0);
          "
        ></div>
        <div
          style="
            position: absolute;
            right: -5px;
            top: 0px;
            transform: rotate(180deg);
            width: 21px;
            height: 21px;
            background: #30ffff;
            clip-path: polygon(0 100%, 0 0, 100% 100%);
          "
        ></div>
        <div
          style="
            position: absolute;
            left: -5px;
            bottom: 0px;
            transform: rotate(270deg);
            width: 21px;
            height: 21px;
            background: #30ffff;
            clip-path: polygon(0 0, 0 100%, 100% 0);
          "
        ></div>
        <div
          style="
            position: absolute;
            right: -5px;
            bottom: 0px;
            transform: rotate(270deg);
            width: 21px;
            height: 21px;
            background: #30ffff;
            clip-path: polygon(0 100%, 0 0, 100% 100%);
          "
        ></div>
        <!-- 插槽内容 -->
        <slot :data="Item"></slot>
      </a-row>
    </div>
  </div>

  <!-- 当前标签页 -->
  <div
    :id="NowTabID"
    style="display: flex"
    :style="{
      justifyContent: routerKey === 'PBSBulletinBoardForXYZ' ? 'end' : 'center',
      marginRight: routerKey === 'PBSBulletinBoardForXYZ' ? '10px' : '0',
    }"
  ></div>
  <!-- 摄像头显示 -->
  <div
    v-for="(item, index) in cameraLstState.showCameraLst"
    v-show="item.show"
    :style="{
      border: '1px solid #03a9f3',
      borderRadius: '10px',
      zIndex: item.zIndex,
      width: `${item.width}px`,
      height: 'auto',
      left: `${item.left}px`,
      top: `${item.top}px`,
    }"
    :id="item.id + index"
    class="camera"
    :key="index"
  >
    <div
      @mousedown="dragAble(item, index)"
      @touchstart="touchstartDragAble(item, index)"
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px;
        background: rgb(6, 41, 71);
        border-radius: 10px 10px 0 0;
      "
    >
      <span class="cameraTitle">{{ item.CameraName }}</span>
      <close-circle-filled
        class="cameraTitle"
        @click="deleteCameraLst(item, index)"
      />
    </div>
    <!-- <video
      v-if="item.IPAddress"
      :id="item.CameraName"
      muted
      class="video-js"
      controls
      style="width: 100%">
    </video> -->
    <div
      v-if="!item.IPAddress"
      :id="item.CameraName"
      style="
        height: 200px;
        width: 100%;
        background: #062947;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0 0 10px 10px;
      "
    >
      暂无摄像头
    </div>
  </div>

  <!-- 重置地图按钮 -->
  <a-button
    v-show="resetMapBtnShow"
    class="resetMapBtn"
    @click="resetMap($event)"
    :style="{ top: `${resetMapBtnTop}px`, left: `${resetMapBtnLeft}px` }"
    @mouseover="DialogData.showResetMapBtn = true"
    @mouseleave="DialogData.showResetMapBtn = false"
  >
    <i class="iconfont icon-ditucaozuo" style="font-size: 25px"></i>
    <div
      v-show="DialogData.showResetMapBtn"
      style="position: absolute; left: 50px"
    >
      重置视角
    </div>
  </a-button>
</template>

<script setup>
import {
  reactive,
  onMounted,
  ref,
  onBeforeUnmount,
  watch,
  nextTick,
  defineProps,
  defineEmits,
  defineExpose,
} from "vue";
import { CloseOutlined, CloseCircleFilled } from "@ant-design/icons-vue";
import { customConfig, API, ip, JDPWebApi } from "@/api";
import moment from "moment";
import axios from "axios";
import videojs from "video.js";
import { useRouter } from "vue-router";
import { debounce, isEqual } from "lodash";
import {
  clickThroughTest,
  resetCoordinateSystem,
  rgbaToPixiColor,
  getHighContrastRGBA,
  positionJson,
  createPolygonGraphic,
} from "./js/mapUtils";
import { drawCamera, createCameraLstState } from "./js/camera";
import {
  drawFieldTexts,
  drawFieldText,
  createTextState,
} from "./js/text";
import {
  drawBlockAndCombLines,
  createBlockCombState,
} from "./js/block";
import {
  drawCarSprites,
  drawRouterSprites,
  drawShipSprites,
  drawMaterials,
  drawPBSs,
  createSpriteState,
  stopAnimation,
} from "./js/sprite";
import { drawLayer, createMapLayerState } from "./js/layer";
import positionPng from "@/assets/imgs/PPMS/position.png";
// ------------------------------
// 事件与属性定义
// ------------------------------
const router = useRouter();

/**
 * 组件对外触发的事件
 */
const emit = defineEmits([
  "changeWheel", // 缩放变化事件
  "changePosition", // 位置变化事件
  "changeClick", // 点击事件
  "showModal", // 显示模态框事件
  "changeShowTransitRecords", // 变更显示记录事件
]);

/**
 * 组件接收的属性定义
 */
const props = defineProps({
  CarLst: { type: Array, default: () => [] },
  router: { type: Array, default: () => [] },
  resetMapBtnShow: { type: Boolean, default: true },
  drawRouter: { type: Boolean, default: false },
  NowShowViewName: { type: String, default: undefined },
  NowTabID: { type: String, default: null },
  mapObj: {
    type: Object,
    default: () => ({
      MapHeight: 1080,
      MapWidth: 1920,
      backgroundColor: 0xffffff,
      OffsetY: 0,
      OffsetX: 0,
    }),
  },
  isHull: { type: Boolean, default: false },
  mapLayerInfos: { type: Array, default: () => [] },
  mapOriginSize: { type: Array, default: () => [] },
  save: { type: Boolean, default: false },
  saveName: { type: String, default: "" },
  resetMapBtnTop: { type: Number, default: 930 },
  resetMapBtnLeft: { type: Number, default: 30 },
  NowPBSs: { type: Array, default: () => [] },
  FieldTexts: { type: Array, default: () => [] },
  ShouldDrawCamera: { type: Boolean, default: true },
  cameraLst: { type: Array, default: () => [] },
  Clickable: { type: Boolean, default: true },
  fieldClickable: { type: Boolean, default: false },
  NowLightPBSsID: { type: Array, default: () => [] },
  APITimerSetting: { type: Number, default: 5 },
  feildTextVisible: { type: Boolean, default: false },
  feildBlockVisible: { type: Boolean, default: false },
  feildCombVisible: { type: Boolean, default: false },
  wheelInfo: { type: Array, default: () => [] },
  positionInfo: { type: [Array, Object], default: () => [] },
  clickInfo: { type: String, default: "" },
  showPlan: { type: Boolean, default: false },
  showHullDialogData: { type: String, default: "" },
  isSynced: { type: Boolean, default: false },
  oneDefaultColor: { type: Boolean, default: false },
  NowTab: { type: String, default: "00000000-0000-0000-0000-000000000000" },
  NowList: { type: String, default: "" },
  blockInfoLst: { type: Array, default: () => [] },
  combInfoLst: { type: Array, default: () => [] },
  mapHeightZoom: { type: Number, default: 1 },
  colorList: { type: Array, default: () => [] },
  mapHigherParam: { type: Boolean, default: false },
  projectMapLocationInfos: { type: Array, default: () => [] },
  projectImgLst: { type: Array, default: () => [] },
  showLightPBSs: { type: Array, default: () => [] },
  materialMapLocationInfos: { type: Object, default: () => ({}) },
  FieldInfos: { type: Object, default: () => ({}) },
  FieldTextInfos: { type: Object, default: () => ({}) },
  /** 本地模式：为true时不调用任何接口，使用mockData展示地图基本功能（底图、拖拽、PBS） */
  local: { type: Boolean, default: false },
});

// ------------------------------
// Mock 数据（local 模式使用）
// ------------------------------
const MOCK_MAP_INFO = {
  MapWidth: 1000,
  MapHeight: 800,
  SourceProjectionWKT: '+proj=longlat +datum=WGS84 +no_defs',
  TargetProjectionWKT: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs',
  Origin: { X: 0, Y: 0 },
  Scale: 1,
  LayerInfos: [
    {
      ZIndex: 0,
      Elements: [
        // 主厂房区域
        {
          Type: "Polygon",
          FieldID: "field-001",
          Name: "主厂房",
          FillColor: 0x1a3a5c,
          BorderWidth: 2,
          BorderColor: 0x30ffff,
          BorderType: "Default",
          TextColor: 0xffffff,
          MapPoints: [
            { X: 100, Y: 100 }, { X: 500, Y: 100 },
            { X: 500, Y: 350 }, { X: 100, Y: 350 },
          ],
        },
        // 分段车间
        {
          Type: "Polygon",
          FieldID: "field-002",
          Name: "分段车间",
          FillColor: 0x0d4a6b,
          BorderWidth: 2,
          BorderColor: 0x30ffff,
          BorderType: "Default",
          TextColor: 0xffffff,
          MapPoints: [
            { X: 550, Y: 100 }, { X: 900, Y: 100 },
            { X: 900, Y: 350 }, { X: 550, Y: 350 },
          ],
        },
        // 堆场区域
        {
          Type: "Polygon",
          FieldID: "field-003",
          Name: "堆场区域",
          FillColor: 0x0a3050,
          BorderWidth: 1,
          BorderColor: 0x2090c0,
          BorderType: "Default",
          TextColor: 0xffffff,
          MapPoints: [
            { X: 100, Y: 400 }, { X: 400, Y: 400 },
            { X: 400, Y: 600 }, { X: 100, Y: 600 },
          ],
        },
        // 涂装车间
        {
          Type: "Polygon",
          FieldID: "field-004",
          Name: "涂装车间",
          FillColor: 0x14405e,
          BorderWidth: 1,
          BorderColor: 0x2090c0,
          BorderType: "Default",
          TextColor: 0xffffff,
          MapPoints: [
            { X: 450, Y: 400 }, { X: 700, Y: 400 },
            { X: 700, Y: 600 }, { X: 450, Y: 600 },
          ],
        },
        // 码头区域
        {
          Type: "Polygon",
          FieldID: "field-005",
          Name: "码头",
          FillColor: 0x062947,
          BorderWidth: 2,
          BorderColor: 0x1890ff,
          BorderType: "Default",
          TextColor: 0xffffff,
          MapPoints: [
            { X: 100, Y: 650 }, { X: 900, Y: 650 },
            { X: 900, Y: 750 }, { X: 100, Y: 750 },
          ],
        },
      ],
    },
  ],
};

const MOCK_PBS_LIST = [
  {
    PBSID: "pbs-001",
    PBSCode: "PBS-A01",
    MapPoints: [
      { X: 150, Y: 150 }, { X: 280, Y: 150 },
      { X: 280, Y: 280 }, { X: 150, Y: 280 },
    ],
    CenterX: 215,
    CenterY: 215,
    Angle: 0,
    Mirror: false,
    DefaultColor: 0x1890ff,
    Transparency: 0.6,
    PlanStatus: 0,
    RefObjectType: 0,
  },
  {
    PBSID: "pbs-002",
    PBSCode: "PBS-B02",
    MapPoints: [
      { X: 320, Y: 150 }, { X: 450, Y: 150 },
      { X: 450, Y: 280 }, { X: 320, Y: 280 },
    ],
    CenterX: 385,
    CenterY: 215,
    Angle: 0,
    Mirror: false,
    DefaultColor: 0x52c41a,
    Transparency: 0.6,
    PlanStatus: 0,
    RefObjectType: 0,
  },
  {
    PBSID: "pbs-003",
    PBSCode: "PBS-C03",
    MapPoints: [
      { X: 600, Y: 150 }, { X: 800, Y: 150 },
      { X: 800, Y: 300 }, { X: 600, Y: 300 },
    ],
    CenterX: 700,
    CenterY: 225,
    Angle: 0,
    Mirror: false,
    DefaultColor: 0xfa8c16,
    Transparency: 0.6,
    PlanStatus: 0,
    RefObjectType: 0,
  },
];

// ------------------------------
// 状态管理
// ------------------------------
// 创建独立的状态实例
const blockCombState = createBlockCombState();
const spriteState = createSpriteState();
const cameraLstState = createCameraLstState();
const textState = createTextState();
const mapLayerState = createMapLayerState();

// 路由相关
// const routerKey = router.currentRoute.value.path.split("/")[2]
//   ? router.currentRoute.value.path.split("/")[2]
//   : router.currentRoute.value.path.split("/")[1];
// const MapConfigParams = customConfig?.IntergratedManagementBoard?.Params;
// const ProjectProcessParams = customConfig?.ProjectProcess?.Params;
// const ConfigParams = customConfig[routerKey]?.Params;

// 对话框相关
const dialogRef = ref(null);
let ClickedMapItemBorder = {};
const DialogData = reactive({
  showResetMapBtn: false, // 重置按钮显示状态
  DefaultHeight: 1080, // 默认高度
  DefaultWidth: 1920, // 默认宽度
  Height: window.innerHeight, // 当前窗口高度
  Width: window.innerWidth, // 当前窗口宽度
  zoomX: null, // X轴缩放比例
  zoomY: null, // Y轴缩放比例
  showDialog: false, // 对话框显示状态
  DialogX: 0, // 对话框X坐标
  lineX: 0, // 连接线X坐标
  lineY: 0, // 连接线Y坐标
  DialogY: 0, // 对话框Y坐标
  lineLength: 0, // 连接线长度
  lineDeg: 0, // 连接线角度
  ClickedMapItems: [], // 当前点击的地图元素
  /**
   * 关闭对话框并重置状态
   */
  closeDialog() {
    if (DialogData.showDialog) {
      ClickedMapItemBorder.visible = false;
      DialogData.showDialog = false;
      clickEventType.value = "";
      DialogData.ClickedMapItems = [];
      emit("changeShowTransitRecords");
      Map.render?.();
    }
  },
});

// 地图核心实例
let Map = null;
let mapContainer = null;
let mapInfo = {};

// 其他状态变量
const modalTitle = ref("");
const shipNoTitle = ref("");
let scale = ref(0);
let angle = ref(0);
let originPositionX = ref(0);
let originPositionY = ref(0);
let originScale = ref(0);
const minScale = 0.1;
const maxScale = 15.0;
let itemBorderLst = [];
let clickEventType = ref("");
// 初始化交互状态
const interactionState = {
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  containerStart: { x: 0, y: 0 },
  isPinching: false,
  initialDistance: 0,
  isWheel: false,
};

// 保存事件处理函数引用，用于正确移除
const bindedHandlers = [];
// ------------------------------
// 配置常量
// ------------------------------
/**
 * 地图交互配置常量
 */
const INTERACTION_CONFIG = {
  DRAG_THRESHOLD: 5, // 拖拽触发阈值(像素)
  NORMAL_ZOOM_DELTA: 0.1, // 普通模式缩放步长
  HULL_ZOOM_DELTA: 0.3, // 船体模式缩放步长
  TEXTURES: {
    // 普通单张纹理（原配置）
    camera: { path: "images/PPMS/IntergratedManagementDashboard/camera.png" },
    shipPisiton: {
      path: "images/PPMS/IntergratedManagementDashboard/shipPosition.png",
    },
    departmentPosition: {
      path: "images/PPMS/IntergratedManagementDashboard/departmentPosition.png",
    },
    pingbanche: { path: "images/WorkShopMangement/pingbanche.png" },
    pingbanchece: { path: "images/WorkShopMangement/pingbanchece.png" },
    blueArrow: { path: "images/WorkShopMangement/arrow-blue.png" },
  },
};
const SPRITE_FRAMES = {};

// 初始化雪碧图（无网络请求）
async function initPositionSpritesheet() {
  // 已初始化直接返回
  if (SPRITE_FRAMES.positionSprite) return;

  try {
    const positionFrames = [];
    const textureCache = PIXI.utils.TextureCache;
    const targetFrameCount = 60; // 目标帧数量
    let hasMissingFrames = false; // 标记是否有缺失的帧

    // 第一步：先检查缓存中是否已有需要的帧纹理
    for (let i = 1; i <= targetFrameCount; i++) {
      const frameKey = `frame${i}`;
      // 缓存中存在则直接复用
      if (textureCache[frameKey]) {
        positionFrames.push(textureCache[frameKey]);
      } else {
        hasMissingFrames = true;
        break; // 有缺失则停止检查，需要解析雪碧图
      }
    }

    // 第二步：如果缓存完整，直接赋值返回
    if (!hasMissingFrames && positionFrames.length === targetFrameCount) {
      SPRITE_FRAMES.positionSprite = positionFrames;
      console.log("复用缓存中的雪碧图帧：", positionFrames.length);
      return;
    }

    // 第三步：缓存不完整，解析雪碧图补充缓存（仅执行一次）
    // 创建BaseTexture（带缓存策略）
    const baseTexture = PIXI.BaseTexture.from(positionPng, {
      resourceOptions: { autoLoad: true },
      skipCache: false, // 允许BaseTexture缓存，但避免重复
    });

    // 雪碧图配置（确保meta正确）
    const spritesheetConfig = {
      ...positionJson,
      meta: {
        ...positionJson.meta,
        image: positionPng,
        scale: positionJson.meta.scale || 1,
      },
    };

    const spritesheet = new PIXI.Spritesheet(baseTexture, spritesheetConfig);

    // 仅当未解析过时才执行解析（核心：避免重复解析导致缓存重复）
    if (!spritesheet._parsed) {
      await spritesheet.parse();
    }

    // 第四步：收集帧纹理（优先用缓存，无则从spritesheet取）
    const positionFramesNew = [];
    const frameKeys = Object.keys(spritesheet.textures).filter((key) =>
      /frame\d+/.test(key)
    );
    const sortedFrameKeys = frameKeys.sort((a, b) => {
      const numA = parseInt(a.replace("frame", ""), 10);
      const numB = parseInt(b.replace("frame", ""), 10);
      return numA - numB;
    });

    for (
      let i = 0;
      i < Math.min(targetFrameCount, sortedFrameKeys.length);
      i++
    ) {
      const frameKey = sortedFrameKeys[i];
      // 优先用缓存中的纹理，避免重复添加
      const frameTexture =
        textureCache[frameKey] || spritesheet.textures[frameKey];
      if (frameTexture) {
        positionFramesNew.push(frameTexture);
        // 确保缓存ID唯一（防止后续冲突）
        if (!textureCache[frameKey]) {
          textureCache[frameKey] = frameTexture;
        }
      }
    }

    SPRITE_FRAMES.positionSprite = positionFramesNew;
    console.log("雪碧图帧初始化完成（补充缓存）：", positionFramesNew.length);
  } catch (error) {
    console.error("雪碧图初始化失败：", error);
    SPRITE_FRAMES.positionSprite = null;
  }
}

/**
 * 点击事件相关配置
 */
const CLICK_CONFIG = {
  BORDER_STYLE: {
    NORMAL: { width: 1, color: 0x30ffff }, // 普通边框样式
    HIGHLIGHT: { width: 2, color: 0x30ffff }, // 高亮边框样式
  },
  DIALOG_OFFSET: {
    // 对话框偏移配置
    DEFAULT_Y: 20,
    LEGEND_STYLE_Y: 100,
    COLUMN_CHART_1_Y: 180,
    COLUMN_CHART_2_Y: 190,
    X_ADJUST: 175,
  },
  LINE_ADJUST: {
    // 连接线调整配置
    DELTA_X: 150,
    DELTA_Y: -50,
  },
};

// ------------------------------
// 拖拽处理函数
// ------------------------------
/**
 * 统一处理拖动逻辑的核心函数
 * @param {HTMLElement} element - 被拖动的元素
 * @param {Object} index - 元素索引信息
 * @param {Number} startX - 起始X坐标
 * @param {Number} startY - 起始Y坐标
 * @param {Function} onMove - 移动回调函数
 * @returns {Function} 移动处理函数
 */
const handleDrag = (element, index, startX, startY, onMove) => {
  const diffX = startX - element.offsetLeft;
  const diffY = startY - element.offsetTop;

  return (clientX, clientY) => {
    let left = clientX - diffX;
    let top = clientY - diffY;

    // 优化：提前计算边界值，减少重复计算
    const maxLeft = window.innerWidth - element.offsetWidth;
    const maxTop = window.innerHeight - element.offsetHeight;
    left = Math.max(0, Math.min(left, maxLeft));
    top = Math.max(0, Math.min(top, maxTop));

    index.left = left;
    index.top = top;
    onMove?.(left, top);
  };
};

/**
 * 触摸拖动事件处理
 * @param {Object} index - 元素索引信息
 * @param {Number} i - 索引
 * @param {Event} e - 触摸事件
 */
const touchstartDragAble = (index, i, e) => {
  const dragElement = document.getElementById(`${index.id}${i}`);
  if (!dragElement) return;

  changePlace(index);
  e = e || window.event;

  const startX = e.touches[0].clientX;
  const startY = e.touches[0].clientY;
  const handleMove = handleDrag(dragElement, index, startX, startY);

  const touchmoveHandler = (ev) => {
    handleMove(ev.touches[0].clientX, ev.touches[0].clientY);
  };

  const touchendHandler = () => {
    document.removeEventListener("touchmove", touchmoveHandler);
    document.removeEventListener("touchend", touchendHandler);
  };

  document.addEventListener("touchmove", touchmoveHandler);
  document.addEventListener("touchend", touchendHandler);
};

const dragHandlers = new WeakMap();

/**
 * 鼠标拖动事件处理
 * @param {Object} index - 元素索引信息
 * @param {Number} i - 索引
 * @param {Event} e - 鼠标事件
 */
const dragAble = (index, i, e) => {
  const dragElement = document.getElementById(`${index.id}${i}`);
  if (!dragElement) return;

  changePlace(index);
  e = e || window.event;

  const startX = e.clientX;
  const startY = e.clientY;
  const handleMove = handleDrag(dragElement, index, startX, startY);

  const mousemoveHandler = (ev) => {
    handleMove(ev.clientX, ev.clientY);
  };

  const mouseupHandler = () => {
    document.removeEventListener("mousemove", mousemoveHandler);
    document.removeEventListener("mouseup", mouseupHandler);
    document.removeEventListener("mouseleave", mouseleaveHandler);
  };

  const mouseleaveHandler = () => mouseupHandler();

  document.addEventListener("mousemove", mousemoveHandler);
  document.addEventListener("mouseup", mouseupHandler);
  document.addEventListener("mouseleave", mouseleaveHandler);
};

/**
 * 调整元素层级，将拖动元素置于顶层
 * @param {Object} index - 元素索引信息
 */
const changePlace = (index) => {
  const dragItem = cameraLstState.showCameraLst.find(
    (it) => it.id === index.id
  );
  if (!dragItem || cameraLstState.showCameraLst.length <= 1) return;

  const maxZIndex = Math.max(
    ...cameraLstState.showCameraLst.map((item) => item.zIndex)
  );
  if (dragItem.zIndex === maxZIndex) return;

  // 调整其他元素层级
  cameraLstState.showCameraLst.forEach((item) => {
    if (item.zIndex > dragItem.zIndex) item.zIndex--;
  });

  // 将当前元素置于顶层
  dragItem.zIndex = maxZIndex;
};

// ------------------------------
// 地图初始化与交互
// ------------------------------
/**
 * 初始化地图应用
 */
const initialize = () => {
  // 创建PIXI应用实例
  const mapOptions = {
    width: props.mapObj.MapWidth || 100,
    height: props.mapObj.MapHeight || 100,
    backgroundColor: props.mapObj.backgroundColor || 0x062947,
    antialias: props.mapObj.antialias || false,
    autoStart: props.mapObj.autoStart || false,
  };

  Map = new PIXI.Application(mapOptions);

  // 添加到DOM容器
  const containerEl = document.getElementById(props.NowTabID);
  if (containerEl) {
    containerEl.appendChild(Map.view);
  } else {
    console.error(`未找到ID为${props.NowTabID}的容器元素`);
    return;
  }

  // 创建场景容器
  mapContainer = new PIXI.Container();
  mapContainer.sortableChildren = true;
  mapContainer.interactive = true;
  Map.stage.addChild(mapContainer);

  // 绑定事件处理
  bindMouseMoveEvent(mapContainer);
  bindInteractionEvents(Map, mapContainer, interactionState);
  loadTextures();

  /**
   * 绑定鼠标移动事件
   * @param {PIXI.Container} container - 容器对象
   */
  function bindMouseMoveEvent(container) {
    container.on("mousemove", (event) => {
      handleFieldMouseMove(event);
    });
  }

  /**
   * 处理场地鼠标移动逻辑
   * @param {Event} event - 鼠标事件
   */
  function handleFieldMouseMove(event) {
    // 非场地点击类型或无数据时直接返回
    if (
      !props.FieldInfos?.MapAreaTotalInfos?.length ||
      !["", "Field"].includes(clickEventType.value)
    ) {
      return;
    }

    const clickPoint = event.data.global;
    const hitElements = clickThroughTest(mapLayerState.MapLayer, clickPoint);

    // 过滤船舶相关元素
    if (hitElements.some((it) => it.ShipNo === undefined)) {
      handleFieldHit(hitElements, clickPoint);
    } else if (!DialogData.ClickedMapItems[0]?.PBSCode) {
      resetDialogState();
    }
  }

  /**
   * 处理场地命中逻辑
   * @param {Array} hitElements - 命中元素列表
   * @param {Object} clickPoint - 点击坐标
   */
  function handleFieldHit(hitElements, clickPoint) {
    const { field, ele } = findMatchingField(hitElements);

    if (field && !DialogData.ClickedMapItems[0]?.ShipNo) {
      // 设置弹窗状态
      clickEventType.value = "Field";
      modalTitle.value = "场地";
      ele.clickEventType = "Field";

      DialogData.ClickedMapItems = [ele];
      DialogData.showDialog = true;
      calculateDialogPosition(clickPoint);
    } else if (!field && !DialogData.ClickedMapItems[0]?.ShipNo) {
      resetDialogState();
    }
  }

  /**
   * 查找匹配的场地
   * @param {Array} hitElements - 命中元素列表
   * @returns {Object} 匹配结果
   */
  function findMatchingField(hitElements) {
    let result = { field: undefined, ele: undefined };

    props.FieldInfos.MapAreaTotalInfos?.some((info) => {
      const match = hitElements.find((item) => item.FieldID === info.FieldID);
      if (match) {
        result = { field: match, ele: info };
        return true;
      }
      return false;
    });

    return result;
  }

  /**
   * 计算对话框位置和连接线
   * @param {Object} clickPoint - 点击坐标
   */
  function calculateDialogPosition(clickPoint) {
    const dom = document.getElementById("dialog");
    if (clickPoint) {
      DialogData.DialogX = clickPoint.x;
      DialogData.DialogY = clickPoint.y; 
    }

    if (dom) {
      // 处理Y轴溢出
      const restHeight = window.innerHeight - DialogData.DialogY - 100;
      const moveHeight = dom.clientHeight - restHeight;
      let deltaY;

      if (restHeight < dom.clientHeight) {
        DialogData.DialogY -= moveHeight;
        deltaY = -50 - moveHeight;
        DialogData.lineY = (DialogData.DialogY * 2 + deltaY) / 2 + moveHeight;
      } else {
        deltaY = -50;
        DialogData.lineY = (DialogData.DialogY * 2 + deltaY) / 2;
      }

      // 处理X轴溢出
      const restWidth = window.innerWidth - DialogData.DialogX - 200;
      const moveWidth = dom.clientWidth - restWidth;
      let deltaX;

      if (restWidth < dom.clientWidth) {
        DialogData.DialogX -= moveWidth;
        deltaX = 150 - moveWidth;
        DialogData.lineX = (DialogData.DialogX * 2 + deltaX) / 2 + moveWidth;
      } else {
        deltaX = 150;
        DialogData.lineX = (DialogData.DialogX * 2 + deltaX) / 2;
      }

      // 计算角度
      const angle = (360 * Math.atan2(deltaY, deltaX)) / (2 * Math.PI);
      DialogData.lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      DialogData.lineDeg = angle <= -90 ? 360 + angle : angle;
    }
  }

  /**
   * 重置弹窗状态
   */
  function resetDialogState() {
    DialogData.ClickedMapItems = [];
    ClickedMapItemBorder.visible = false;
    DialogData.showDialog = false;
    emit("changeShowTransitRecords");
    clickEventType.value = "";
  }

  /**
   * 绑定交互事件（鼠标和触摸）
   * @param {PIXI.Application} Map - 地图应用实例
   * @param {PIXI.Container} container - 容器对象
   * @param {Object} state - 交互状态对象
   */

  function bindInteractionEvents(Map, container, state) {
    // 辅助函数：绑定事件并记录引用
    function bindEvent(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      bindedHandlers.push({ target, event, handler, options });
    }

    // 鼠标按下
    const mousedownHandler = (event) => {
      Map.ticker.start();
      state.isDragging = true;
      state.dragStart = { x: event.clientX, y: event.clientY };
      state.containerStart = { x: container.x, y: container.y };
      closeDialogsAndCleanup();
    };
    bindEvent(Map.view, "mousedown", mousedownHandler);

    // 鼠标松开
    const mouseupHandler = () => handleMouseUp();
    bindEvent(Map.view, "mouseup", mouseupHandler);

    // 鼠标移动
    const mousemoveHandler = (event) => {
      handleMouseMove(event, container, state);
    };
    bindEvent(Map.view, "mousemove", mousemoveHandler);

    // 滚轮事件优化
    Map.ticker.add(() => {
      if (state.isWheel) {
        Map.render();
        state.isWheel = false;
        if (!props.mapObj.autoStart) {
          Map.ticker.stop();
        }
      }
    });

    // 鼠标滚轮
    const wheelHandler_view = (event) => {
      handleMouseWheel(event, container, state);
    };
    bindEvent(Map.view, "wheel", wheelHandler_view);

    // 鼠标释放和离开 - 统一设置 isDragging = false
    const stopDraggingHandler = () => {
      state.isDragging = false;
    };
    bindEvent(Map.view, "mouseup", stopDraggingHandler);
    bindEvent(Map.view, "mouseleave", stopDraggingHandler);

    // 触摸事件
    bindEvent(Map.view, "touchstart", handleTouchStart, { passive: false });
    bindEvent(Map.view, "touchend", handleTouchEnd, { passive: false });
    bindEvent(Map.view, "touchmove", handleTouchMove, { passive: false });

    /**
     * 触摸开始处理
     * @param {Event} event - 触摸事件
     */
    function handleTouchStart(event) {
      Map.ticker.start();

      if (event.touches.length === 1) {
        state.isDragging = true;
        state.dragStart = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
        state.containerStart = { x: container.x, y: container.y };
      } else if (event.touches.length === 2) {
        state.isPinching = true;
      }
    }

    /**
     * 触摸结束处理
     */
    function handleTouchEnd() {
      if (!props.mapObj.autoStart) {
        Map.ticker.stop();
      }
      state.isDragging = false;
      state.isPinching = false;
      state.initialDistance = 0;
    }

    /**
     * 触摸移动处理
     * @param {Event} event - 触摸事件
     */
    function handleTouchMove(event) {
      // 单指拖动
      if (state.isDragging && event.touches.length === 1) {
        const deltaX = event.touches[0].clientX - state.dragStart.x;
        const deltaY = event.touches[0].clientY - state.dragStart.y;
        container.position.set(
          state.containerStart.x + deltaX,
          state.containerStart.y + deltaY
        );
      }

      // 双指缩放
      if (state.isPinching && event.touches.length === 2) {
        handlePinchZoom(event, container, state);
      }

      closeDialogsAndCleanup();
    }
  }

  /**
   * 处理鼠标松开
   */
  function handleMouseUp() {
    if (props.isHull && !props.feildTextVisible && mapLayerState.fieldTextLst) {
      mapLayerState.fieldTextLst.forEach((item) => {
        item.visible = false;
      });
    }
    if (!props.mapObj.autoStart) {
      Map.ticker.stop();
    }
  }

  /**
   * 处理鼠标移动
   * @param {Event} event - 鼠标事件
   * @param {PIXI.Container} container - 容器对象
   * @param {Object} state - 交互状态对象
   */
  function handleMouseMove(event, container, state) {
    if (!state.isDragging) return;

    const deltaX = event.clientX - state.dragStart.x;
    const deltaY = event.clientY - state.dragStart.y;

    // 超过拖拽阈值关闭对话框
    if (
      Math.abs(deltaX) > INTERACTION_CONFIG.DRAG_THRESHOLD ||
      Math.abs(deltaY) > INTERACTION_CONFIG.DRAG_THRESHOLD
    ) {
      closeDialogsAndCleanup();
    }

    // 更新容器位置
    container.position.set(
      state.containerStart.x + deltaX,
      state.containerStart.y + deltaY
    );

    // 清除激活文字
    if (props.isHull && !props.feildTextVisible) {
      mapLayerState.fieldTextLst?.forEach((it) => (it.visible = false));
    }

    // 同步位置
    if (props.isSynced) {
      emit("changePosition", [container.x, container.y]);
    }

    emit("showModal", "");
  }

  /**
   * 处理鼠标滚轮缩放
   * @param {Event} event - 鼠标事件
   * @param {PIXI.Container} container - 容器对象
   * @param {Object} state - 交互状态对象
   */
  function handleMouseWheel(event, container, state) {
    state.isWheel = true;
    Map.ticker.start();
    closeDialogsAndCleanup();

    // 计算缩放增量
    const delta = props.isHull
      ? event.deltaY > 0
        ? -INTERACTION_CONFIG.HULL_ZOOM_DELTA
        : INTERACTION_CONFIG.HULL_ZOOM_DELTA
      : event.deltaY > 0
      ? -INTERACTION_CONFIG.NORMAL_ZOOM_DELTA
      : INTERACTION_CONFIG.NORMAL_ZOOM_DELTA;

    // 计算缩放变换
    const mousePos = Map.renderer.plugins.interaction.mouse.global;
    const scaleTransform = calculateScaleTransform(mousePos);

    // 更新缩放并限制范围
    scale.value = Math.max(minScale, Math.min(maxScale, scale.value + delta));

    // 应用变换
    container.scale.set(scale.value);
    const newPosition = scaleTransform.getNewPosition(scale.value);
    container.position.set(newPosition.x, newPosition.y);

    // 调整元素大小
    adjustElementsOnScale(scale.value);

    // 同步缩放事件
    if (props.isSynced) {
      emit("changeWheel", [scale.value, newPosition]);
    }
  }

  /**
   * 处理双指缩放
   * @param {Event} event - 触摸事件
   * @param {PIXI.Container} container - 容器对象
   * @param {Object} state - 交互状态对象
   */
  function handlePinchZoom(event, container, state) {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentDistance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY
    );

    if (state.initialDistance > 0) {
      // 计算中心点
      const centerPos = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      // 计算缩放变换
      const scaleTransform = calculateScaleTransform(centerPos);

      // 更新缩放并限制范围
      scale.value = Math.max(
        minScale,
        Math.min(
          maxScale,
          scale.value * (currentDistance / state.initialDistance)
        )
      );

      // 应用变换
      container.scale.set(scale.value);
      const newPosition = scaleTransform.getNewPosition(scale.value);
      container.position.set(newPosition.x, newPosition.y);

      // 调整元素大小
      adjustElementsOnScale(scale.value);
    }

    state.initialDistance = currentDistance;
  }

  /**
   * 统一关闭弹窗和清理状态
   */
  function closeDialogsAndCleanup() {
    if (DialogData.showDialog) {
      ClickedMapItemBorder.visible = false;
      DialogData.ClickedMapItems = [];
      DialogData.showDialog = false;
      emit("changeShowTransitRecords");
      clickEventType.value = "";
    }
    if (props.isHull) {
      emit("showModal", "");

      // 清除边框
      if (itemBorderLst.length) {
        itemBorderLst.forEach((border) => border.destroy?.());
        itemBorderLst = [];
      }

      // 控制文本显示
      if (!props.feildTextVisible && mapLayerState.fieldTextLst) {
        mapLayerState.fieldTextLst.forEach((item) => {
          item.visible = false;
        });
      }

      if (props.isSynced) {
        emit("changeClick", "");
      }
    }
  }

  /**
   * 加载纹理资源
   */
  // 全局存储雪碧图帧数据（方便后续复用）

  function loadTextures() {
    const loader = PIXI.Loader.shared;
    const textures = INTERACTION_CONFIG.TEXTURES;

    // 检查加载器是否正在运行
    if (loader.loading) {
      loader.onComplete.once(() => loadTextures());
      return;
    }

    // 标记是否需要加载新资源
    let needLoad = false;

    // 遍历所有纹理配置
    Object.entries(textures).forEach(([key, config]) => {
      // 跳过已加载的资源
      if (loader.resources[key]) return;

      needLoad = true;
      // 区分普通纹理和雪碧图
      if (config.type === "spritesheet") {
        // 加载雪碧图（JSON）
        loader.add(key, config.path);
      } else {
        // 加载普通单张纹理
        loader.add(key, config.path);
      }
    });

    // 只有存在未加载资源时才执行加载
    if (needLoad) {
      loader.load((loader, resources) => {
        console.log("纹理资源加载完成");

        // 加载完成后，预处理雪碧图的帧数据
        Object.entries(textures).forEach(([key, config]) => {
          if (config.type === "spritesheet" && resources[key]) {
            const { frameCount = 0, framePrefix = "frame" } = config;
            const frames = [];
            // 提取所有帧纹理
            for (let i = 1; i <= frameCount; i++) {
              const frameKey = `${framePrefix}${i}`;
              const frameTexture = resources[key].textures[frameKey];
              if (frameTexture) {
                frames.push(frameTexture);
              } else {
                console.warn(`雪碧图${key}缺少帧：${frameKey}`);
              }
            }
            // 存储帧数据到全局，方便后续使用
            SPRITE_FRAMES[key] = frames;
            console.log(`雪碧图${key}提取${frames.length}帧`);
          }
        });
      });

      // 加载错误处理
      loader.onError.add((err, resource) => {
        console.error(`纹理${resource.name}加载失败：`, err);
      });
    } else {
      // 资源已加载，直接预处理雪碧图帧（避免重复加载后未初始化帧）
      Object.entries(textures).forEach(([key, config]) => {
        if (config.type === "spritesheet" && !SPRITE_FRAMES[key]) {
          const { frameCount = 0, framePrefix = "frame" } = config;
          const frames = [];
          for (let i = 1; i <= frameCount; i++) {
            const frameKey = `${framePrefix}${i}`;
            const frameTexture = loader.resources[key].textures[frameKey];
            if (frameTexture) frames.push(frameTexture);
          }
          SPRITE_FRAMES[key] = frames;
        }
      });
    }
  }
};

/**
 * 调整缩放时的元素大小
 * @param {Number} newScale - 新的缩放比例
 */
const adjustElementsOnScale = (newScale) => {
  textState.FieldTextsPIXI?.forEach((it) => {
    it.scale.set(originScale.value / newScale);
  });
  textState.FieldTexts?.forEach((it) => {
    it.scale.set(originScale.value / newScale);
  });
  cameraLstState.CameraLstPIXI?.forEach((it) => {
    it.scale.set(originScale.value / 2 / newScale);
  });
};
/**
 * 计算缩放中心点和位置
 * @param {Object} mousePos - 鼠标位置
 * @returns {Object} 缩放变换信息
 */
const calculateScaleTransform = (mousePos) => {
  const tempX = (-mapContainer.position.x + mousePos.x) / scale.value;
  const tempY = (-mapContainer.position.y + mousePos.y) / scale.value;

  return {
    tempX,
    tempY,
    getNewPosition(newScale) {
      return {
        x: -(this.tempX * newScale - mousePos.x),
        y: -(this.tempY * newScale - mousePos.y),
      };
    },
  };
};
// ------------------------------
// 图层加载与绘制
// ------------------------------
/**
 * 加载并绘制船体底图
 */
const asyncloadMapLayerHull = async () => {
  mapInfo.MapWidth = props.mapOriginSize[0];
  mapInfo.MapHeight = props.mapOriginSize[1];
  let xarr = [];
  let yarr = [];
  let arr = [];

  // 销毁原底图绘制释放缓存
  if (mapLayerState.MapLayer.length) {
    mapLayerState.MapLayer.forEach((item) => item.destroy());
    mapLayerState.MapLayer = [];
  }

  // 销毁已有的文本信息
  if (mapLayerState.fieldTextLst.length) {
    mapLayerState.fieldTextLst.forEach((item) => item.destroy());
    mapLayerState.fieldTextLst = [];
  }

  drawLayer(
    xarr,
    yarr,
    arr,
    props,
    mapContainer,
    onHullFieldClick,
    mapInfo,
    mapLayerState
  );

  resetCoordinateSystem(
    arr,
    mapInfo,
    angle,
    props,
    scale,
    originPositionX,
    originPositionY,
    mapContainer,
    originScale
  );

  drawBlockAndCombLines(props, mapContainer, blockCombState);
  Map.render();
};

/**
 * 本地模式：使用 mockData 加载底图和 PBS，不调用任何接口
 */
const asyncloadMapLayerLocal = async () => {
  // 销毁原底图
  if (mapLayerState.MapLayer.length) {
    mapLayerState.MapLayer.forEach((item) => item.destroy());
    mapLayerState.MapLayer = [];
  }

  let xarr = [];
  let yarr = [];
  let arr = [];

  mapInfo = { ...MOCK_MAP_INFO };
  angle.value = 0;

  drawLayer(
    xarr, yarr, arr, props, mapContainer,
    onHullFieldClick, mapInfo, mapLayerState
  );

  resetCoordinateSystem(
    arr, mapInfo, angle, props, scale,
    originPositionX, originPositionY, mapContainer, originScale
  );

  // 绘制 mock PBS
  drawPBSs(
    { ...props, NowPBSs: MOCK_PBS_LIST, Clickable: true, NowLightPBSsID: [], showLightPBSs: [], oneDefaultColor: false },
    mapContainer, Map, ConfigParams, mapInfo,
    PBSOnClick, materialOnClick, spriteState
  );

  Map.render();
};

/**
 * 加载并绘制普通底图
 */
const asyncloadMapLayer = async () => {
  // 销毁原底图绘制释放缓存
  if (mapLayerState.MapLayer.length) {
    mapLayerState.MapLayer.forEach((item) => item.destroy());
    mapLayerState.MapLayer = [];
  }

  // 底图绘制
  let xarr = [];
  let yarr = [];
  let arr = [];
  const sessionStorageMapData = JSON.parse(
    sessionStorage.getItem(props.saveName)
  );

  // 从缓存读取
  if (
    sessionStorageMapData &&
    sessionStorageMapData?.time === moment().format("YYYY-MM-DD")
  ) {
    const res = sessionStorageMapData.QueryFactoryMapInfoData;
    const mapInfoRes = sessionStorageMapData.QueryMapData;

    if (DialogData.showDialog) {
      ClickedMapItemBorder.visible = false;
      DialogData.showDialog = false;
      emit("changeShowTransitRecords");
      clickEventType.value = "";
    }

    angle.value = res.data.Angle;

    if (mapInfoRes.status === 1) {
      mapInfo = mapInfoRes.data;
      if (mapInfo.LayerInfos.length) {
        drawLayer(
          xarr,
          yarr,
          arr,
          props,
          mapContainer,
          onHullFieldClick,
          mapInfo,
          mapLayerState
        );

        resetCoordinateSystem(
          arr,
          mapInfo,
          angle,
          props,
          scale,
          originPositionX,
          originPositionY,
          mapContainer,
          originScale
        );
      }
    }
  } else {
    // 从API获取（异步）
    try {
      // 1. 异步调用QueryFactoryMapInfo
      const { data: res } = await axios.post(
        ip + "/api/TransportManagement/QueryFactoryMapInfo",
        {
          FactoryID:
            props.NowTabID.split("_")[0] ||
            "00000000-0000-0000-0000-000000000000",
        }
      );

      if (res?.status === 1) {
        if (DialogData.showDialog) {
          ClickedMapItemBorder.visible = false;
          DialogData.showDialog = false;
          emit("changeShowTransitRecords");
          clickEventType.value = "";
        }

        angle.value = res.data.Angle;

        // 2. 异步调用QueryMap
        const { data: mapInfoRes } = await axios.post(
          JDPWebApi + "/api/Map/QueryMap",
          {
            mapLayerIDs: res.data.LayerIDs.concat(res.data.DashedLineLayerIDs),
            mapStyleType: 3,
          }
        );

        if (mapInfoRes?.status === 1) {
          mapInfo = mapInfoRes.data;

          if (mapInfo.LayerInfos.length) {
            drawLayer(
              xarr,
              yarr,
              arr,
              props,
              mapContainer,
              onHullFieldClick,
              mapInfo,
              mapLayerState
            );

            // 缓存数据
            if (props.saveName) {
              const obj = {
                time: moment().format("YYYY-MM-DD"),
                QueryFactoryMapInfoData: res,
                QueryMapData: mapInfoRes,
              };

              // 检查缓存大小
              const sizeInMB =
                unescape(encodeURIComponent(JSON.stringify(obj))).length /
                (1024 * 1024);
              if (sizeInMB < 5) {
                // sessionStorage.setItem(props.saveName, JSON.stringify(obj));
              }
            }

            // 重置坐标系
            resetCoordinateSystem(
              arr,
              mapInfo,
              angle,
              props,
              scale,
              originPositionX,
              originPositionY,
              mapContainer,
              originScale
            );

            // 其他绘制逻辑
            drawFieldText(
              props.FieldTexts,
              mapInfo,
              mapContainer,
              props,
              mapLayerState.MapLayer,
              ClickedMapItemBorder,
              DialogData,
              emit,
              clickEventType,
              Map,
              MapLayerPush,
              textState
            );
            drawMaterials(
              props,
              mapInfo,
              ConfigParams,
              mapContainer,
              materialOnClick,
              spriteState,
              Map
            );

            drawPBSs(
              props,
              mapContainer,
              Map,
              ConfigParams,
              mapInfo,
              PBSOnClick,
              materialOnClick,
              spriteState
            );

            if (props.ShouldDrawCamera) {
              drawCamera(
                mapContainer,
                props.cameraLst,
                mapInfo,
                originScale,
                scale,
                DialogData,
                Map,
                props,
                cameraLstState
              );
            }
              drawShipSprites(
                props,
                mapInfo,
                mapContainer,
                Map,
                shipSpritesOnClick,
                departmentSpritesOnClick,
                spriteState,
                angle.value,
                interactionState,
                scale,
                SPRITE_FRAMES
              );
            drawFieldTexts(props, mapInfo, mapContainer, Map, textState);
          }
        }
      }
    } catch (error) {
      console.error("加载地图图层失败:", error);
    }
  }
};

/**
 * 向地图图层添加元素
 * @param {Object} item - 要添加的元素
 */
const MapLayerPush = (item) => {
  mapLayerState.MapLayer.push(item);
};

// ------------------------------
// 事件处理函数
// ------------------------------
/**
 * 删除摄像头列表项
 * @param {Object} caption - 摄像头信息
 */
const deleteCameraLst = (caption) => {
  const camera = cameraLstState.showCameraLst.find(
    (item) => item.CameraName === caption.CameraName
  );
  if (camera) camera.show = false;

  if (caption.IPAddress) {
    const player = videojs(document.getElementById(caption.CameraName));
    if (player) player.dispose();
  }
};

/**
 * 创建高亮边框
 * @param {Object} target - 目标元素
 * @param {Array} vertices - 多边形顶点
 * @param {Object} style - 边框样式
 * @returns {PIXI.Graphics} 边框图形
 */
const createHighlightBorder = (
  target,
  vertices,
  style = CLICK_CONFIG.BORDER_STYLE.NORMAL
) => {
  // 直接使用已导入的createPolygonGraphic函数
  const border = createPolygonGraphic(
    null, // item - 不需要
    vertices, // polygonVertices
    null, // mapInfo - 不需要
    { width: style.width, color: style.color }, // borderConfig - 自定义边框配置
    0, // fillColor - 0表示透明，因为只是边框
    0, // transparency - 0表示完全透明
    {
      hasFill: false, // 只绘制边框，不填充
      interactive: false, // 不需要交互
      centerCalculation: false, // 不计算中心
      position: { x: target.x, y: target.y, angle: 0, scaleX: 1, scaleY: 1 }, // 直接使用目标位置
    }
  );
  return border;
};

/**
 * 清除现有边框列表
 * @param {Array} borderList - 边框列表
 */
const clearBorderList = (borderList) => {
  if (borderList.length) {
    // 遍历边框列表并销毁，确保每个边框只被销毁一次
    borderList.forEach((border) => {
      if (border && border.destroy && typeof border.destroy === "function") {
        try {
          border.destroy();
        } catch (error) {
          console.warn("销毁边框时出错:", error);
        }
      }
    });
    borderList.length = 0;
  }
};

/**
 * 调整对话框位置并计算连接线
 * @param {HTMLElement} dom - 对话框DOM元素
 * @param {Object} globalPoint - 点击元素的全局位置
 * @param {Object} config - 配置参数
 */
const adjustDialogAndLine = (dom, globalPoint, config = {}) => {
  const {
    xAdjust = 0,
    yOffset = CLICK_CONFIG.DIALOG_OFFSET.DEFAULT_Y,
    lineDeltaX = CLICK_CONFIG.LINE_ADJUST.DELTA_X,
    lineDeltaY = CLICK_CONFIG.LINE_ADJUST.DELTA_Y,
  } = config;
  // 初始位置计算
  DialogData.DialogX = globalPoint.x + xAdjust;
  DialogData.DialogY = globalPoint.y + yOffset;
  nextTick(() => {
    if (!dom) return;

    // 垂直位置调整
    const restHeight = window.innerHeight - DialogData.DialogY - 100;
    const moveHeight = dom.clientHeight - restHeight;
    let deltaY = lineDeltaY;
    if (restHeight < dom.clientHeight) {
      DialogData.DialogY -= moveHeight;
      deltaY -= moveHeight;
      DialogData.lineY = (DialogData.DialogY * 2 + deltaY) / 2 + moveHeight;
    } else {
      DialogData.lineY = (DialogData.DialogY * 2 + deltaY) / 2;
    }
    // 水平位置调整
    const restWidth = window.innerWidth - DialogData.DialogX - 200;
    const moveWidth = dom.clientWidth - restWidth;
    let deltaX = lineDeltaX;

    if (restWidth < dom.clientWidth) {
      DialogData.DialogX -= moveWidth;
      deltaX -= moveWidth;
      DialogData.lineX = (DialogData.DialogX * 2 + deltaX) / 2 + moveWidth;
    } else {
      DialogData.lineX = (DialogData.DialogX * 2 + deltaX) / 2;
    }

    // 连接线角度和长度计算
    const angle = (360 * Math.atan2(deltaY, deltaX)) / (2 * Math.PI);
    DialogData.lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    DialogData.lineDeg = angle <= -90 ? 360 + angle : angle;
  });
};

/**
 * 重置对话框和交互状态
 */
const resetDialogState = () => {
  // 安全设置边框可见性，避免null引用错误
  if (
    ClickedMapItemBorder &&
    typeof ClickedMapItemBorder.visible !== "undefined"
  ) {
    ClickedMapItemBorder.visible = false;
  }
  DialogData.showDialog = false;
  emit("changeShowTransitRecords");
  DialogData.ClickedMapItems = [];
};

/**
 * 获取对话框Y轴偏移量
 * 根据配置参数动态计算
 * @returns {Number} Y轴偏移量
 */
const getDialogYOffset = () => {
  if (ConfigParams?.ShowColunmChart === 3) {
    return CLICK_CONFIG.DIALOG_OFFSET.DEFAULT_Y;
  } else {
    if (ConfigParams?.LegendStyle === 1) {
      return CLICK_CONFIG.DIALOG_OFFSET.LEGEND_STYLE_Y;
    }

    switch (ConfigParams?.ShowColunmChart) {
      case 1:
        return CLICK_CONFIG.DIALOG_OFFSET.COLUMN_CHART_1_Y;
      case 2:
        return CLICK_CONFIG.DIALOG_OFFSET.COLUMN_CHART_2_Y;
      default:
        return 0;
    }
  }
};

/**
 * 船体底图点击事件处理
 * @param {Event} event - 点击事件
 */
const onHullFieldClick = (event) => {
  setTimeout(() => {
    event.stopPropagation();
    const target = event.target;
    const mousePosition = event.data.global;

    // 控制文本显示
    if (!props.feildTextVisible && mapLayerState.fieldTextLst) {
      mapLayerState.fieldTextLst.forEach((item) => {
        item.visible = item.text === target.name;
      });
    }

    // 清除现有边框并创建新边框
    clearBorderList(itemBorderLst);
    const highlightList =
      mapLayerState.MapLayer?.filter((item) => item.name === target.name) || [];
    highlightList.forEach((graphic) => {
      const itemBorder = createHighlightBorder(
        graphic,
        graphic.MyPolygonVertices,
        CLICK_CONFIG.BORDER_STYLE.NORMAL
      );
      itemBorderLst.push(itemBorder);
      mapContainer.addChild(itemBorder);
    });

    // 准备弹窗信息
    const mapID = props.NowTabID;
    const pbsInfo = {
      PBSName: target.name,
      clientX:
        mapID.indexOf("actualSmall") !== -1
          ? mousePosition.x + props.mapObj.MapWidth + 15 + 40
          : mousePosition.x + 15,
      clientY: mousePosition.y,
    };

    // 显示弹窗并同步状态
    emit("showModal", pbsInfo);
    if (props.isSynced) {
      emit("changeClick", target.name);
    }
    Map.render();
  }, 100);
};

/**
 * PBS点击事件处理
 * @param {Object} PBS - PBS数据对象
 */
const PBSOnClick = (PBSID, setPosition) => {
  let PBS = spriteState.PBSs.find((it) => it.PBSID === PBSID.PBSID);
  if (setPosition) {
    resetMap();
    // 计算缩放变换
    const pbsGlobalPos = PBS.getGlobalPosition();
    const scaleTransform = calculateScaleTransform(pbsGlobalPos);
    // 更新缩放并限制范围
    scale.value = 2;
    // 应用变换
    mapContainer.scale.set(scale.value);
    const newPosition = scaleTransform.getNewPosition(scale.value);
    mapContainer.position.set(newPosition.x, newPosition.y);
    // 调整元素大小
    adjustElementsOnScale(scale.value);
    Map.render();
  }

  resetDialogState();
  clickEventType.value = "PBS";
  modalTitle.value = PBS.PBSCode;

  // 清除现有边框并创建新边框
  clearBorderList(itemBorderLst);
  ClickedMapItemBorder = createHighlightBorder(
    PBS,
    PBS.MyPolygonVertices,
    CLICK_CONFIG.BORDER_STYLE.HIGHLIGHT
  );

  // 创建高亮边框
  ClickedMapItemBorder.angle = PBS.MyAngle;
  ClickedMapItemBorder.scale.x = mapInfo.Scale
    ? PBS.MyMirror
      ? -mapInfo.Scale
      : mapInfo.Scale
    : 1;
  ClickedMapItemBorder.scale.y = mapInfo.Scale || 1;
  itemBorderLst.push(ClickedMapItemBorder);
  mapContainer.addChild(ClickedMapItemBorder);
  Map.render();

  // 查询PBS详细信息
  API.QueryPBSDetailInfo({ PBSIDs: [PBS.PBSID] }, (res) => {
    if (res.status === 1) {
      DialogData.showDialog = true;

      const dom = document.getElementById("dialog");
      DialogData.ClickedMapItems = res.data.map((it) => ({
        ...it,
        clickEventType: "PBS",
      }));

      // 计算对话框位置
      const globalPoint = PBS.getGlobalPosition();
      const xAdjust =
        ConfigParams?.ShowColunmChart === 1
          ? CLICK_CONFIG.DIALOG_OFFSET.X_ADJUST
          : 0;

      adjustDialogAndLine(dom, globalPoint, {
        xAdjust,
        yOffset: getDialogYOffset(),
      });

      // exportMapAsPNG()
    }
  });

  // 单独的导出函数，确保正确的时机和渲染器
  function exportMapAsPNG() {
    // 确保使用正确的渲染器实例（通常是创建地图的app.renderer）
    const renderer = Map.renderer; // 替换Map.renderer为实际的app实例

    if (!renderer) {
      console.error("未找到渲染器实例");
      return;
    }

    // 强制触发一次渲染，确保所有元素都已绘制
    renderer.render(mapContainer); // 传入地图容器而非stage，确保只导出地图内容

    // 使用canvas提取方式，兼容性更好
    const canvas = renderer.extract.canvas();

    // 转换为blob并下载
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PBS-${PBS?.PBSCode || "map"}.png`; // 文件名包含PBS编码
        document.body.appendChild(a);
        a.click();

        // 清理资源
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        console.error("生成图片失败");
      }
    }, "image/png");
  }
};

const updateMapWidth = (newWidth, newHeight, newScale) => {
  if (!newWidth || newWidth <= 0) {
    console.error("无效的参数，无法更新地图宽度");
    return;
  }

  if (newScale) {
    scale.value = newScale;
    originScale.value = newScale;
    mapContainer.scale.set(newScale);
  }

  // 1. 更新PIXI应用的渲染尺寸（内部画布尺寸）
  Map.renderer.resize(newWidth, newHeight ? newHeight : Map.screen.height);

  // 2. 更新DOM元素尺寸（避免画布拉伸）
  const view = Map.view; // 获取canvas元素
  view.style.width = `${newWidth}px`;
  // 保持高度不变（或根据需要同步更新）
  view.style.height = `${newHeight ? newHeight : Map.screen.height}px`;

  // 3. 调整地图容器的布局（可选，根据业务需求）
  // 如果需要居中显示，可重新计算容器位置
  // 1. 先重置容器的核心变换状态（顺序很重要）
  mapContainer.pivot.set(0, 0); // 重置支点
  mapContainer.scale.set(originScale.value); // 重置缩放

  // 2. 同步响应式缩放变量
  scale.value = originScale.value;

  // 计算新的地图中心点信息
  const oldCenterX = mapInfo.MapWidth / 2;
  // const oldCenterY = mapInfo.MapHeight / 2;
  const oldCenterY = mapInfo.MapHeight / 2;
  const num = -angle.value / 180;
  const deg = Math.PI * num;
  const newCenterX = oldCenterX * Math.cos(deg) - oldCenterY * Math.sin(deg);
  const newCenterY = oldCenterX * Math.sin(deg) + oldCenterY * Math.cos(deg);
  // 更新位置和缩放信息
  originPositionX.value =
    (newWidth ? newWidth : props.mapObj.MapWidth) / 2 -
    newCenterX * scale.value;
  originPositionY.value =
    (props.mapHeightZoom * (newHeight ? newHeight : props.mapObj.MapHeight)) /
      2 -
    newCenterY * scale.value;

  mapContainer.position.set(originPositionX.value, originPositionY.value);
  // 4. 触发重绘，确保变更生效
  if (DialogData.showDialog) {
    ClickedMapItemBorder.visible = false;
    DialogData.showDialog = false;
    emit("changeShowTransitRecords");
    clickEventType.value = "";
  }
  Map.render();
};

defineExpose({
  PBSOnClick,
  updateMapWidth,
});

/**
 * 物资点击事件处理
 * @param {Object} pixiItem - 物资PIXI对象
 * @param {Boolean} isSprite - 是否为精灵对象
 */
const materialOnClick = (pixiItem, isSprite = false) => {
  resetDialogState();
  clickEventType.value = "Material";
  modalTitle.value = pixiItem.Name;

  // 非精灵元素创建边框
  if (!isSprite) {
    ClickedMapItemBorder = createHighlightBorder(
      pixiItem,
      pixiItem.MyPolygonVertices,
      CLICK_CONFIG.BORDER_STYLE.HIGHLIGHT
    );
    ClickedMapItemBorder.angle = pixiItem.MyAngle;
    ClickedMapItemBorder.scale.x = mapInfo.Scale
      ? pixiItem.MyMirror
        ? -mapInfo.Scale
        : mapInfo.Scale
      : 1;
    ClickedMapItemBorder.scale.y = mapInfo.Scale || 1;
    mapContainer.addChild(ClickedMapItemBorder);
  }

  // 查询物资详细信息
  API.QueryMaterialDetailInfo(
    { MaterialIDs: [pixiItem.RefObjectID] },
    (res) => {
      if (res.status === 1) {
        const dom = document.getElementById("dialog");
        DialogData.ClickedMapItems = res.data.map((it) => ({
          ...it,
          clickEventType: "Material",
        }));
        DialogData.showDialog = true;

        // 计算对话框位置
        const globalPoint = pixiItem.getGlobalPosition();
        const xAdjust =
          ConfigParams?.ShowColunmChart === 1
            ? CLICK_CONFIG.DIALOG_OFFSET.X_ADJUST
            : 0;

        adjustDialogAndLine(dom, globalPoint, {
          xAdjust,
          yOffset: getDialogYOffset(),
        });
      }
    }
  );
};

/**
 * 船图点击事件处理
 * @param {Object} element - 船舶元素
 */
const shipSpritesOnClick = (element) => {
  resetDialogState();
  clickEventType.value = "ShipSprites";

  // 查询船舶详细信息
  API.QueryShipDetail({ ProjectInfoID: element.projectInfoID }, (res) => {
    if (res.status === 1) {
      shipNoTitle.value = res.data?.ShipNo || "";
      modalTitle.value = res.data?.ShipName || "";

      DialogData.ClickedMapItems = [
        {
          ...res.data,
          clickEventType: "ShipSprites",
        },
      ];
      DialogData.showDialog = true;

      // 计算对话框位置
      const dom = document.getElementById("dialog");
      const globalPoint = element.getGlobalPosition();
      const xAdjust =
        ConfigParams?.ShowColunmChart === 1
          ? CLICK_CONFIG.DIALOG_OFFSET.X_ADJUST
          : 0;
      adjustDialogAndLine(dom, globalPoint, {
        xAdjust,
        yOffset: getDialogYOffset(),
      });
    }
  });
};

const departmentSpritesOnClick = (element, item) => {
  resetDialogState();
  clickEventType.value = "DepartmentSprites";
  // 查询船舶详细信息
  API.QueryDepartmentAttendanceAndHiddenRisk(
    { depID: item.DepartmentID },
    (res) => {
      if (res.status === 1) {
        shipNoTitle.value = res.data?.AttendanceCount || "";
        modalTitle.value = res.data?.AttendanceCount || "";
        DialogData.ClickedMapItems = [
          {
            ...res.data,
            clickEventType: "DepartmentSprites",
          },
        ];
        DialogData.showDialog = true;

        // 计算对话框位置
        const dom = document.getElementById("dialog");
        const globalPoint = element.getGlobalPosition();
        const xAdjust =
          ConfigParams?.ShowColunmChart === 1
            ? CLICK_CONFIG.DIALOG_OFFSET.X_ADJUST
            : 0;

        adjustDialogAndLine(dom, globalPoint, {
          xAdjust,
          yOffset: getDialogYOffset(),
        });
      }
    }
  );
};

// ------------------------------
// 控制函数
// ------------------------------
// 地图重置方法（微调确保状态同步）
const resetMap = () => {
  if (DialogData.showDialog) {
    ClickedMapItemBorder.visible = false;
    DialogData.showDialog = false;
    emit("changeShowTransitRecords");
    clickEventType.value = "";
  }

  if (props.isHull) {
    mapContainer.pivot.set(0, 0);
    scale.value = originScale.value;
    mapContainer.scale.set(originScale.value);
  } else {
    // 1. 先重置容器的核心变换状态（顺序很重要）
    mapContainer.pivot.set(0, 0); // 重置支点
    mapContainer.scale.set(originScale.value); // 重置缩放

    // 2. 同步响应式缩放变量
    scale.value = originScale.value;

    // 计算新的地图中心点信息
    const oldCenterX = mapInfo.MapWidth / 2;
    // const oldCenterY = mapInfo.MapHeight / 2;
    const oldCenterY = mapInfo.MapHeight / 2;
    const num = -angle.value / 180;
    const deg = Math.PI * num;
    const newCenterX = oldCenterX * Math.cos(deg) - oldCenterY * Math.sin(deg);
    const newCenterY = oldCenterX * Math.sin(deg) + oldCenterY * Math.cos(deg);

    // 更新位置和缩放信息
    if (!props.isHull) {
      originPositionX.value =
        props.mapObj.MapWidth / 2 - newCenterX * scale.value;
      originPositionY.value =
        (props.mapHeightZoom * props.mapObj.MapHeight) / 2 -
        newCenterY * scale.value;
    } else {
      // 船体图设置默认缩放比例
      let mapScaleHull = Number(
        (
          (((props.mapObj.MapWidth / mapInfo.MapWidth) * mapInfo.MapHeight) /
            props.mapObj.MapHeight) *
          (ProjectProcessParams?.Scale ? ProjectProcessParams?.Scale : 0.5)
        ).toFixed(1)
      );
      originPositionX.value =
        props.mapObj.MapWidth / 2 -
        newCenterX * scale.value +
        (mapInfo.MapWidth * scale.value) / 2;
      originPositionY.value =
        props.mapObj.MapHeight / 2 -
        newCenterY * scale.value +
        (mapInfo.MapHeight * mapScaleHull) / 2;
      scale.value = mapScaleHull;
    }
  }
  textState.FieldTextsPIXI?.forEach((it) =>
    it.scale.set(originScale.value / scale.value)
  );
  cameraLstState.CameraLstPIXI?.forEach((it) =>
    it.scale.set(originScale.value / 2 / scale.value)
  );

  mapContainer.position.set(originPositionX.value, originPositionY.value); // 重置位置

  // 5. 同步其他地图（如果需要）
  if (props.isSynced) {
    emit("changePosition", [originPositionX.value, originPositionY.value]);
    emit("changeWheel", [
      scale.value,
      [originPositionX.value, originPositionY.value],
    ]);
  }

  // 6. 关闭弹框并重绘
  emit("showModal", "");
  Map.render();
};

// ------------------------------
// 工具函数
// ------------------------------
/**
 * 触发地图渲染
 */
const triggerMapRender = () => {
  if (Map && typeof Map.render === "function") {
    Map.render();
  }
};

/**
 * 清除边框列表
 */
const clearItemBorderList = () => {
  if (itemBorderLst.length) {
    itemBorderLst.forEach((border) => border.destroy?.());
    itemBorderLst = [];
  }
};

/**
 * 控制文本可见性
 * @param {Boolean} visible - 是否可见
 * @param {String|null} targetText - 目标文本，为null则控制所有文本
 */
const setFieldTextVisibility = (visible, targetText = null) => {
  if (!mapLayerState.fieldTextLst) return;

  mapLayerState.fieldTextLst.forEach((item) => {
    item.visible = targetText
      ? item.text === targetText // 只显示目标文本
      : props.feildTextVisible
      ? props.feildTextVisible
      : visible; // 全部显示/隐藏
  });
};

// ------------------------------
// 监听器配置
// ------------------------------
// 1. 地图基础数据监听
watch(
  () => [props.NowTabID, props.isHull],
  async (newVal, oldVal) => {
    if (props.local) return;
    if (!isEqual(newVal, oldVal)) {
      DialogData.showDialog = false;
      emit("changeShowTransitRecords");
      clickEventType.value = "";

      // 根据条件加载不同地图层
      if (!newVal[1]) {
        await asyncloadMapLayer();
      } else {
        await asyncloadMapLayerHull();
      }
    }
  },
  { immediate: false }
);

// 2. 地图数据变化监听
watch(
  () => [props.mapLayerInfos, props.mapOriginSize],
  async (newVal, oldVal) => {
    if (props.local) return;
    if (!isEqual(newVal, oldVal)) {
      // 根据条件重新加载地图层
      if (!props.isHull) {
        await asyncloadMapLayer();
      } else {
        await asyncloadMapLayerHull();
      }
    }
  },
  { deep: true }
);

// 2. 合并绘图相关监听
const drawWatchers = [
  {
    deps: () => [props.CarLst],
    handler: () =>{
      drawCarSprites(
        props,
        mapInfo,
        MapConfigParams,
        angle,
        mapContainer,
        Map,
        spriteState
      )}
  },
  {
    deps: () => [props.router],
    handler: () =>{
      drawRouterSprites(
        props,
        mapInfo,
        MapConfigParams,
        mapContainer,
        scale,
        Map,
        resetMap,
        spriteState
      )}
  },
  {
    deps: () => [props.projectMapLocationInfos],
    handler: () => {
      drawShipSprites(
        props,
        mapInfo,
        mapContainer,
        Map,
        shipSpritesOnClick,
        departmentSpritesOnClick,
        spriteState,
        angle.value,
        interactionState,
        scale,
        SPRITE_FRAMES
      );
    },
  },
  {
    deps: () => [props.materialMapLocationInfos],
    handler: () =>{
      drawMaterials(
        props,
        mapInfo,
        ConfigParams,
        mapContainer,
        materialOnClick,
        spriteState,
        Map
      )}
  },
  {
    deps: () => [props.FieldTextInfos],
    handler: () => {drawFieldTexts(props, mapInfo, mapContainer, Map, textState)},
  },
];

// 批量注册绘图监听器
drawWatchers.forEach(({ deps, handler }) => {
  watch(deps, (newVal, oldVal) => {
    if (props.local) return;
    if (!isEqual(newVal, oldVal)) {
      handler();
    }
  }, { deep: true });
});

// 3. PBS 和相机绘制防抖处理
const debouncedDrawPBSs = debounce(async () => {
  if (mapLayerState.MapLayer.length) {
    drawPBSs(
      props,
      mapContainer,
      Map,
      ConfigParams,
      mapInfo,
      PBSOnClick,
      materialOnClick,
      spriteState
    );

    if (props.ShouldDrawCamera) {
      drawCamera(
        mapContainer,
        props.cameraLst,
        mapInfo,
        originScale,
        scale,
        DialogData,
        Map,
        props,
        cameraLstState
      );
    }
  }
}, 200);

watch(
  () => [
    props.NowList,
    props.NowTab,
    props.NowPBSs,
    props.showLightPBSs,
    mapInfo,
    props.cameraLst,
  ],
  (newVal, oldVal) => {
    if (props.local) return;
    if (!isEqual(newVal, oldVal)) {
      debouncedDrawPBSs();
    }
  },
  { flush: "post", deep: true }
);

// 4. 文本与图形显示控制监听
watch(
  () => [
    props.feildTextVisible,
    props.feildBlockVisible,
    props.feildCombVisible,
  ],
  (newVal, oldVal) => {
    if (!isEqual(newVal, oldVal)) {
      const [textVisible, blockVisible, combVisible] = newVal;
      // 控制场地文字显示
      setFieldTextVisibility(textVisible);

      // 控制总段显示
      if (blockCombState.BlockLayer.length) {
        blockCombState.BlockLayer.forEach(
          (item) => (item.visible = blockVisible)
        );
        blockCombState.blockTextLst.forEach(
          (item) => (item.visible = blockVisible)
        );
      }

      // 控制预组显示
      if (blockCombState.CombLayer.length) {
        blockCombState.CombLayer.forEach((item) => (item.visible = combVisible));
        blockCombState.combTextLst.forEach(
          (item) => (item.visible = combVisible)
        );
      }

      triggerMapRender();
    }
  }
);

// 5. 地图变换监听（缩放、位置）
watch(
  () => [props.wheelInfo, props.positionInfo],
  (newVal, oldVal) => {
    if (!isEqual(newVal, oldVal)) {
      const [wheelInfo, positionInfo] = newVal;
      // 处理缩放
      if (wheelInfo?.length) {
        mapContainer.scale.set(wheelInfo[0]);
        scale.value = wheelInfo[0];
        mapContainer.position.set(wheelInfo[1]?.x, wheelInfo[1]?.y);
      }

      // 处理位置
      if (positionInfo?.length) {
        mapContainer.position.set(positionInfo[0], positionInfo[1]);
      }
      triggerMapRender();
    }
  },
  { deep: true }
);

// 6. 点击事件监听
watch(
  () => props.clickInfo,
  (newValue, oldValue) => {
    if (!isEqual(newValue, oldValue)) {
      clearItemBorderList();
      if (newValue) {
        // 显示目标文本，隐藏其他
        // setFieldTextVisibility(false, newValue);
        if (!props.feildTextVisible) {
          mapLayerState.fieldTextLst?.forEach((item) => {
            if (item.text === newValue) {
              item.visible = true;
            } else {
              item.visible = false;
            }
          });
        }

        // 创建高亮边框
        const highlightList =
          mapLayerState.MapLayer?.filter((item) => item.name === newValue) || [];

        highlightList.forEach((graphic) => {
          // 直接使用已导入的createPolygonGraphic函数创建高亮边框
          const itemBorder = createPolygonGraphic(
            null, // item - 不需要
            graphic.MyPolygonVertices, // polygonVertices
            null, // mapInfo - 不需要
            { width: 1, color: 0x30ffff }, // borderConfig - 自定义边框配置
            0, // fillColor - 0表示透明，因为只是边框
            0, // transparency - 0表示完全透明
            {
              hasFill: false, // 只绘制边框，不填充
              interactive: false, // 不需要交互
              centerCalculation: false, // 不计算中心
              position: {
                x: graphic.x,
                y: graphic.y,
                angle: 0,
                scaleX: 1,
                scaleY: 1,
              }, // 直接使用目标位置
            }
          );
          itemBorderLst.push(itemBorder);
          mapContainer.addChild(itemBorder);
        });
      } else {
        // 清空文本显示
        if (!props.feildTextVisible) {
          mapLayerState.fieldTextLst?.forEach((item) => {
            item.visible = false;
          });
        }
        if (itemBorderLst.length) {
          itemBorderLst?.forEach((border) => {
            border.destroy();
          });
          itemBorderLst = [];
        }
      }

      triggerMapRender();
    }
  }
);

// 7. 其他独立监听
watch(
  () => props.mapLayerInfos,
  async (newValue, oldValue) => {
    if (props.local) return;
    if (!isEqual(newValue, oldValue)) {
      if (newValue.length) {
        await asyncloadMapLayerHull();
        resetMap();
      }
    }
  },
  { deep: true }
);

watch(
  () => props.showPlan,
  (newValue, oldValue) => {
    if (!isEqual(newValue, oldValue)) {
      resetMap();
    }
  }
);

watch(
  () => props.colorList,
  (newValue, oldValue) => {
    if (!isEqual(newValue, oldValue)) {
      if (newValue.length) {
        // 重绘图形颜色
        mapLayerState.MapLayer?.forEach((graphic, index) => {
          graphic.clear();
          graphic.lineStyle(graphic.BorderWidth, graphic.BorderColor);
          const pixiColor = rgbaToPixiColor(newValue[index].fillColor);
          graphic.beginFill(pixiColor.color);
          graphic.drawPolygon(graphic.MyPolygonVertices);
          graphic.endFill();
        });

        // 更新字体颜色
        mapLayerState.fieldTextLst?.forEach((item, index) => {
          if (item)
            item.style.fill = getHighContrastRGBA(newValue[index].fillColor);
        });
      }
      triggerMapRender();
    }
  }
);

watch(
  () => props.showHullDialogData,
  (newValue, oldValue) => {
    if (!isEqual(newValue, oldValue)) {
      if (!newValue) {
        setFieldTextVisibility(false);
        clearItemBorderList();
        triggerMapRender();
      }
    }
  }
);

watch(
  () => [props.FieldTexts],
  (newValue, oldValue) => {
    if (props.local) return;
    if (!isEqual(newValue, oldValue)) {
      if (newValue[0].length) {
        drawFieldText(
          newValue[0],
          mapInfo,
          mapContainer,
          props,
          mapLayerState.MapLayer,
          ClickedMapItemBorder,
          DialogData,
          emit,
          clickEventType,
          Map,
          MapLayerPush,
          textState
        );
      }
    }
  },
  { deep: true }
);

let resizeHandler = null;
let wheelHandler = null;

// ------------------------------
// 生命周期
// ------------------------------
onMounted(async () => {
  DialogData.zoomX = DialogData.Width / DialogData.DefaultWidth;
  DialogData.zoomY = DialogData.Height / DialogData.DefaultHeight;
  resizeHandler = () => {
    DialogData.Width = window.innerWidth;
    DialogData.Height = window.innerHeight;
    DialogData.zoomX = DialogData.Width / DialogData.DefaultWidth;
    DialogData.zoomY = DialogData.Height / DialogData.DefaultHeight;
  };
  window.addEventListener("resize", resizeHandler);
  wheelHandler = (event) => {
    if (event.ctrlKey) event.preventDefault();
  };
  window.addEventListener("wheel", wheelHandler, { passive: false });

  // 窗口大小变化监听
  // window.addEventListener("resize", () => {
  //   DialogData.Width = window.innerWidth;
  //   DialogData.Height = window.innerHeight;
  //   DialogData.zoomX = DialogData.Width / DialogData.DefaultWidth;
  //   DialogData.zoomY = DialogData.Height / DialogData.DefaultHeight;
  // });

  // 阻止Ctrl+滚轮缩放页面
  // window.addEventListener(
  //   "wheel",
  //   (event) => {
  //     if (event.ctrlKey) event.preventDefault();
  //   },
  //   { passive: false }
  // );

  // 初始化地图
  await initialize();
  await initPositionSpritesheet();

  // local 模式：使用 mockData，不走任何接口
  if (props.local) {
    await asyncloadMapLayerLocal();
    return;
  }

  // 根据是否是船体图决定绘制底图方法
  if (
    props.NowTabID !== "00000000-0000-0000-0000-000000000000" &&
    !props.isHull
  ) {
    await asyncloadMapLayer();
  } else if (props.isHull) {
    await asyncloadMapLayerHull();
  }
});

onBeforeUnmount(() => {
  console.log("开始清理地图资源...");

  // 0. 停止所有动画
  stopAnimation();

  // 1. 停止所有动画和定时器
  if (Map?.ticker) {
    Map.ticker.stop();
  }

  // 2. 清理 Video.js 实例
  cameraLstState.showCameraLst?.forEach((camera) => {
    if (camera.IPAddress) {
      try {
        const player = videojs(document.getElementById(camera.CameraName));
        if (player) player.dispose();
      } catch (e) {
        console.warn("清理摄像头失败", e);
      }
    }
  });

  // 3. 清理 PIXI 图形对象（按层级）
  [
    mapLayerState.MapLayer,
    blockCombState.BlockLayer,
    blockCombState.CombLayer,
  ].forEach((layer) => {
    if (layer?.length) {
      layer.forEach((item) => item.destroy?.({ children: true }));
      layer.length = 0;
    }
  });

  // 4. 清理精灵和文本
  [...Object.values(spriteState), ...Object.values(textState)].forEach(
    (arr) => {
      if (Array.isArray(arr) && arr.length) {
        arr.forEach((item) => item.destroy?.({ children: true }));
        arr.length = 0;
      }
    }
  );

  // 5 清理边框
  if (itemBorderLst.length) {
    // 安全销毁边框，避免重复销毁导致的refCount错误
    itemBorderLst.forEach((border) => {
      if (border && border.destroy && typeof border.destroy === "function") {
        try {
          border.destroy();
        } catch (error) {
          console.warn("销毁边框时出错:", error);
        }
      }
    });
    itemBorderLst.length = 0;
  }
  // 重置点击边框引用，不再单独销毁（已在itemBorderLst中处理）
  ClickedMapItemBorder = null;

  // 6. 清理容器
  if (mapContainer) {
    mapContainer.removeAllListeners();
    mapContainer.destroy({ children: true });
    mapContainer = null;
  }

  // 7. 卸载纹理 - 注意：只清理当前地图使用的纹理，不清理全局共享资源
  // const loader = PIXI.Loader.shared;
  // if (loader.resources) {
  //   Object.keys(loader.resources).forEach(key => {
  //     const resource = loader.resources[key];
  //     resource.texture?.destroy(true);
  //     resource.data = null;
  //     delete loader.resources[key];
  //   });
  // }

  // 8. 清理当前地图使用的雪碧图帧 - 保留全局SPRITE_FRAMES结构
  // Object.keys(SPRITE_FRAMES).forEach(key => delete SPRITE_FRAMES[key]);

  // 9. 移除DOM事件 - 使用保存的引用正确移除
  bindedHandlers.forEach(({ target, event, handler, options }) => {
    try {
      target.removeEventListener(event, handler, options);
    } catch (e) {
      console.warn("移除事件监听失败:", event, e);
    }
  });
  bindedHandlers.length = 0;

  window.removeEventListener("resize", resizeHandler);
  window.removeEventListener("wheel", wheelHandler);

  // 10. 销毁PIXI应用
  if (Map) {
    Map.destroy(true, { children: true, texture: true, baseTexture: true });
    Map = null;
  }

  // 11. 清理状态对象
  mapInfo = {};
  DialogData.ClickedMapItems = [];

  console.log("地图资源清理完成");
});
</script>

<style scoped lang="less">
p {
  margin-bottom: 0;
}

.iconBlue {
  color: #18fff7;
  font-size: 20px;
}

#cameraContainer {
  width: 100%;
  height: 100%;
  position: absolute;
}

.camera {
  position: absolute;
  cursor: move;
  width: 370px;
  height: 243px;
  background: rgb(6, 41, 71);
}

.cameraTitle {
  font-family: "PingFang SC Bold";
  font-weight: 700;
  font-size: 25px;
  text-align: left;
  color: #fff;
}

.closeAll {
  margin-left: 305px;
  height: 18px;
  font-size: 12px;
  font-weight: bold;
  color: #2a4c72;
  text-shadow: 0px 4px 10px #00eeff;
}

.resetMapBtn {
  position: absolute;
  top: 920px;
  left: 30px;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(48, 255, 255, 0.19);
  border-radius: 50%;
  color: #30ffff;
  border: 1px solid rgba(48, 255, 255, 0.19);
}

.resetMapBtn:hover {
  border: 1px solid;
}

.dialogLine {
  position: fixed;
  width: 2px;
  background-color: #30ffff;
}

#dialog {
  position: fixed;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  // background: #06628d;
  background: rgba(6, 41, 71, 0.85);
  color: #ffffff;
  border: 1px solid #30ffff;

  .dialogHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(
      90deg,
      rgba(0, 255, 246, 0.1) 1%,
      rgba(0, 238, 255, 0.6) 31%,
      rgba(0, 255, 246, 0.3) 51%,
      rgba(0, 238, 255, 0.6) 76%,
      rgba(0, 255, 246, 0.1) 100%
    );
    border: 1px solid;
    border-image: linear-gradient(
        90deg,
        rgba(0, 255, 246, 0.5686) 1%,
        rgba(255, 255, 255, 0.35) 22%,
        rgba(0, 255, 246, 0.5686) 51%,
        rgba(255, 255, 255, 0.24) 80%,
        rgba(0, 255, 246, 0.5686) 100%
      )
      1;
    margin: 5px 5px 0 5px;
    padding: 0 10px;
    font-size: 20px;
  }

  .dialogHeader2 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(
      90deg,
      rgba(0, 140, 255, 0.1) 1%,
      rgba(0, 140, 255, 0.5) 30%,
      rgba(0, 140, 255, 0.3) 49%,
      rgba(0, 140, 255, 0.5) 74%,
      rgba(0, 102, 255, 0.1) 100%
    );
    border: 1px solid;
    border-image: linear-gradient(
        90deg,
        rgba(2, 98, 201, 0.9608) 0%,
        rgba(255, 255, 255, 0.35) 22%,
        rgba(2, 98, 201, 0.5528) 50%,
        rgba(255, 255, 255, 0.24) 80%,
        rgba(0, 74, 154, 0.76) 100%
      )
      1;
    margin: 5px 5px 0 5px;
    padding: 0 10px;
    font-size: 20px;
  }

  .dialogHeader3 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(
      90deg,
      #3f54dd 5%,
      rgba(63, 84, 221, 0.5) 30%,
      rgba(63, 84, 221, 0.3) 49%,
      rgba(63, 84, 221, 0.5) 74%,
      rgba(63, 84, 221, 0.1) 100%
    );

    box-sizing: border-box;
    border: 1px solid;
    border-image: linear-gradient(
        90deg,
        rgba(21, 0, 255, 0.9608) 2%,
        rgba(255, 255, 255, 0.35) 22%,
        rgba(21, 0, 255, 0.5528) 50%,
        rgba(255, 255, 255, 0.24) 80%,
        rgba(21, 0, 255, 0.76) 100%
      )
      1;
    margin: 5px 5px 0 5px;
    padding: 0 10px;
    font-size: 20px;
  }
}

::-webkit-scrollbar {
  height: 9px;
  width: 9px;
  background: rgb(27, 53, 90);
}

::-webkit-scrollbar-thumb {
  width: 2px;
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: linear-gradient(270deg, #64e6c0 0%, #687ff9 100%);
}

::-webkit-scrollbar-track {
  width: 2px;
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: rgb(27, 53, 90);
}

::-webkit-scrollbar-corner {
  background: rgb(27, 53, 90);
}
</style>