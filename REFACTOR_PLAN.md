# PixiMap 组件重构计划

> 文档版本：v1.0 | 创建日期：2026-03-07
> 语言：JavaScript (ES Module) | 框架：Vue 3 Composition API + PixiJS
---

## 目录

- [一、现状分析](#一现状分析)
  - [1.1 文件清单](#11-文件清单)
  - [1.2 现有架构模型](#12-现有架构模型)
  - [1.3 功能特性清单](#13-功能特性清单)
  - [1.4 问题清单](#14-问题清单)
- [二、重构目标](#二重构目标)
- [三、目标架构](#三目标架构)
  - [3.1 目录结构](#31-目录结构)
  - [3.2 分层架构说明](#32-分层架构说明)
  - [3.3 各模块职责详解](#33-各模块职责详解)
- [四、分阶段实施计划](#四分阶段实施计划)
  - [P0 阶段：修复关键缺陷](#p0-阶段修复关键缺陷)
  - [P1 阶段：提取核心层](#p1-阶段提取核心层)
  - [P2 阶段：图层插件化 + Composables 拆分](#p2-阶段图层插件化--composables-拆分)
  - [P3 阶段：弹窗组件化 + 收尾优化](#p3-阶段弹窗组件化--收尾优化)
- [五、迁移策略与注意事项](#五迁移策略与注意事项)
- [六、验证清单](#六验证清单)
- [附录 A：Props 归类与图层映射](#附录-aprops-归类与图层映射)
- [附录 B：现有函数迁移去向对照表](#附录-b现有函数迁移去向对照表)

---

## 一、现状分析

### 1.1 文件清单

| 文件路径 | 行数 | 职责 |
|---------|------|------|
| `src/components/pixiMap/index.vue` | 2993 | 主入口组件（PIXI 初始化、事件绑定、API 调用、弹窗、watch、生命周期） |
| `src/components/pixiMap/js/mapUtils.js` | 1330 | 底层工具函数（坐标转换、图形绘制、颜色处理、雪碧图帧数据） |
| `src/components/pixiMap/js/sprite.js` | 1682 | 精灵绘制（船体、车辆、路径动画、PBS、物资、部门标记） |
| `src/components/pixiMap/js/camera.js` | 414 | 摄像头图标绘制与 HLS 视频播放 |
| `src/components/pixiMap/js/layer.js` | 427 | 多边形底图图层绘制（三种模式） |
| `src/components/pixiMap/js/block.js` | 281 | 总段/预组线段绘制 |
| `src/components/pixiMap/js/text.js` | 309 | 场地文字标签绘制 |
| **总计** | **7436** | |

> **注意**：`index.vue` 中的 import 路径实际指向 `../../public/js/map/`（public 目录下的副本），与 `src/components/pixiMap/js/` 并存，存在双份代码维护风险。

### 1.2 现有架构模型

```
index.vue（协调层 - 2993行，承担所有职责）
    │
    ├── 创建独立状态（工厂函数）
    │       createBlockCombState()   ← block.js
    │       createSpriteState()      ← sprite.js
    │       createCameraLstState()   ← camera.js
    │       createTextState()        ← text.js
    │       createMapLayerState()    ← layer.js
    │
    ├── 调用绘制函数（传入 mapContainer、Map 实例及大量参数）
    │       drawLayer()              → layer.js
    │       drawBlockAndCombLines()  → block.js
    │       drawShipSprites()        → sprite.js
    │       drawCarSprites()         → sprite.js
    │       drawRouterSprites()      → sprite.js
    │       drawPBSs()               → sprite.js
    │       drawMaterials()          → sprite.js
    │       drawCamera()             → camera.js
    │       drawFieldText()          → text.js
    │       drawFieldTexts()         → text.js
    │
    └── mapUtils.js（工具基础层 - 被所有模块引用）
```

**当前模式特点：**
- 所有绘制模块以"纯函数 + 外部状态对象"形式组织
- `index.vue` 是唯一的协调者，承担了过多职责
- 绘制函数参数列表冗长（8-12 个参数），耦合严重
- 各绘制函数间无统一接口，新增图层需要修改 `index.vue`

### 1.3 功能特性清单

| 类别 | 功能 | 当前实现位置 |
|------|------|-------------|
| **交互** | 鼠标滚轮缩放 | index.vue handleMouseWheel |
| | 鼠标拖拽平移 | index.vue handleMouseMove |
| | 触摸屏双指缩放 | index.vue handlePinchZoom |
| | 触摸屏单指拖拽 | index.vue handleTouchMove |
| | 重置视角 | index.vue resetMap() |
| | 多地图联动同步 | index.vue watch(wheelInfo/positionInfo) |
| | 点击穿透检测 | mapUtils.js clickThroughTest |
| **底图** | 多边形底图（三种模式） | layer.js drawLayer |
| | 总段/预组线段 | block.js drawBlockAndCombLines |
| | 场地文字标签 | text.js drawFieldText/drawFieldTexts |
| | 动态颜色重绘 | index.vue watch(colorList) |
| **业务图层** | PBS 泊位多边形（含高亮/网格填充） | sprite.js drawPBSs |
| | 船体图片精灵（含进度裁剪/hover 动画） | sprite.js drawShipSprites |
| | 车辆位置图标 | sprite.js drawCarSprites |
| | 路径规划动画（折线+箭头+车辆动画） | sprite.js drawRouterSprites |
| | 物资多边形/精灵 | sprite.js drawMaterials |
| | 部门标记 | sprite.js（type==="department" 分支） |
| | 摄像头图标 + HLS 视频播放 | camera.js drawCamera |
| **弹窗** | PBS 详情弹窗 | index.vue PBSOnClick → API |
| | 船舶详情弹窗 | index.vue shipSpritesOnClick → API |
| | 物资详情弹窗 | index.vue materialOnClick → API |
| | 场地悬浮弹窗 | index.vue handleFieldMouseMove |
| | 部门考勤弹窗 | index.vue departmentSpritesOnClick |
| | 摄像头视频弹窗（含拖拽） | index.vue + camera.js |
| | 弹窗连接线 | index.vue template + calculateDialogPosition |
| **坐标** | 经纬度 → 墨卡托投影（proj4） | mapUtils.js lngLatToMercator |
| | 地图旋转变换 | mapUtils.js resetCoordinateSystem |
| **资源** | 纹理加载（PIXI.Loader.shared） | index.vue loadTextures |
| | 雪碧图帧解析（60帧 AnimatedSprite） | index.vue initPositionSpritesheet |
| | 船体纹理缓存 | sprite.js shipTextureCache |
| | sessionStorage 缓存地图数据 | index.vue asyncloadMapLayer |
| **其他** | 地图导出 PNG（已注释） | index.vue exportMapAsPNG |
| | 对比色文字计算 | mapUtils.js getHighContrastRGBA |
| | 窗口 resize 响应 | index.vue resizeHandler |

### 1.4 问题清单

#### 严重（必须修复）

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| S1 | **事件监听泄漏** | index.vue:2791 | `removeEventListener` 传入新匿名函数，无法移除原绑定，导致内存泄漏 |
| S2 | **同步 XHR 阻塞主线程** | index.vue:1459-1508 | `XMLHttpRequest(..., false)` 同步请求会冻结整个页面，已被浏览器标记 deprecated |
| S3 | **全局单例动画控制器** | sprite.js（模块级变量） | 多实例共享同一个 `animationController`，导致地图实例间互相干扰 |
| S4 | **import 路径指向 public 副本** | index.vue:330-350 | import 引用 `../../public/js/map/`，而 `src/components/pixiMap/js/` 是未被使用的副本 |

#### 中等（应该修复）

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| M1 | **index.vue 2993 行** | index.vue 全文 | 职责过多：PIXI 初始化、事件绑定、API 调用、弹窗逻辑、坐标计算、缓存管理、生命周期清理全混在一起 |
| M2 | **27 个 Props** | index.vue:371-426 | "万能组件"耦合了船厂调度、摄像头监控、路径规划、物资管理等多个业务场景 |
| M3 | **对话框位置计算重复 3 处** | index.vue:886, index.vue:1710, text.js:105 | 三处逻辑高度相似但不完全一致，维护不同步 |
| M4 | **nextTick 误用** | camera.js:384 | `nextTick(fn, delay)` — Vue 的 nextTick 不支持延迟参数，第二个参数被忽略 |
| M5 | **绘制函数参数过多** | 各绘制函数 | 每个 draw 函数需要 8-12 个参数（props、mapContainer、Map、state、callbacks...），耦合严重 |
| M6 | **纹理缓存挂在模块级** | sprite.js shipTextureCache | 纹理缓存未与实例绑定，组件销毁后不会被清理 |

#### 低等（建议优化）

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| L1 | **300 行静态 JSON 内嵌工具文件** | mapUtils.js:1020-1330 positionJson | 雪碧图帧描述数据与工具函数职责不符 |
| L2 | **60 行注释掉的优化代码** | sprite.js:1332-1392 | PBS 差量更新优化方案被注释保留，增加阅读干扰 |
| L3 | **路由耦合** | index.vue:439-441 | 组件内直接读取 `router.currentRoute.value.path` 来区分业务场景 |
| L4 | **PIXI 和 proj4 全局变量** | index.vue / mapUtils.js | 依赖全局 `PIXI` 和 `proj4`，非模块化引入 |
| L5 | **参数名与注释矛盾** | mapUtils.js:928 | 注释"参数顺序应该是(lng, lat)"但调用时传的是 `(centerY, centerX)`，历史 bug 修复遗留 |

---

## 二、重构目标

| 目标 | 量化指标 |
|------|---------|
| **主组件瘦身** | `PixiMap.vue` 从 2993 行降至 200 行以内 |
| **图层可插拔** | 新增图层类型无需修改主组件，只需新增图层文件并注册 |
| **消除内存泄漏** | 事件监听/纹理/动画全部跟随实例生命周期正确清理 |
| **消除阻塞** | 同步 XHR 全部替换为 async/await |
| **多实例安全** | 同一页面多个地图实例互不干扰 |
| **降低耦合** | 绘制函数参数从 8-12 个降至 2-3 个（通过引擎上下文传递） |
| **消除代码重复** | 对话框位置计算统一为单一实现 |

---

## 三、目标架构

### 3.1 目录结构

```
src/components/pixiMap/
│
├── PixiMap.vue                         # 轻量壳组件（~200行）
│                                        # 职责：模板渲染、composable 组装、图层注册
│
├── core/                               # 核心引擎层（与业务无关）
│   ├── PixiEngine.js                   # PIXI.Application 生命周期封装
│   ├── ViewportCamera.js               # 视角控制（缩放/平移/重置/适配）
│   ├── CoordinateSystem.js             # 坐标系统（投影转换/坐标变换）
│   ├── TextureManager.js               # 纹理资源加载与缓存管理
│   └── EventManager.js                 # DOM 事件绑定与自动清理
│
├── composables/                        # Vue 组合式 API 层
│   ├── usePixiEngine.js                # 引擎初始化/销毁生命周期
│   ├── useMapInteraction.js            # 鼠标/触摸交互（拖拽/缩放/捏合）
│   ├── useMapSync.js                   # 多地图联动同步
│   ├── useDialogPosition.js            # 对话框位置计算（统一 3 处重复逻辑）
│   └── useMapData.js                   # 地图数据加载（替代同步 XHR）
│
├── layers/                             # 图层插件（每个图层独立自包含）
│   ├── BaseLayer.js                    # 图层基类（统一接口定义）
│   ├── PolygonLayer.js                 # 多边形底图图层（← layer.js）
│   ├── PBSLayer.js                     # PBS 泊位图层（← sprite.js drawPBSs）
│   ├── ShipSpriteLayer.js              # 船体精灵图层（← sprite.js drawShipSprites）
│   ├── VehicleLayer.js                 # 车辆图层（← sprite.js drawCarSprites）
│   ├── RouteAnimationLayer.js          # 路径动画图层（← sprite.js drawRouterSprites）
│   ├── MaterialLayer.js                # 物资图层（← sprite.js drawMaterials）
│   ├── CameraLayer.js                  # 摄像头图层（← camera.js）
│   ├── BlockCombLayer.js               # 总段/预组图层（← block.js）
│   └── TextLabelLayer.js               # 文字标签图层（← text.js）
│
├── dialogs/                            # 弹窗子组件
│   ├── MapDialog.vue                   # 弹窗容器（连接线 + 定位逻辑）
│   ├── PBSDialog.vue                   # PBS 详情弹窗
│   ├── ShipDialog.vue                  # 船舶详情弹窗
│   ├── MaterialDialog.vue              # 物资详情弹窗
│   ├── FieldDialog.vue                 # 场地悬浮弹窗
│   ├── DepartmentDialog.vue            # 部门考勤弹窗
│   └── CameraVideoDialog.vue          # 摄像头视频弹窗
│
├── utils/                              # 纯工具函数（无状态、无副作用）
│   ├── bindGraphics.js                 # 多边形/虚线绘制（← mapUtils.js 部分）
│   ├── bindColor.js                    # 颜色转换/对比色（← mapUtils.js 部分）
│   ├── projection.js                   # proj4 投影封装（← mapUtils.js lngLatToMercator）
│   ├── geometry.js                     # 几何计算（重心、包围盒、路径插值）
│   └── textMeasure.js                  # 中英混合字符串长度测量
│
└── data/
    └── spriteFrames.json               # 60帧雪碧图帧描述数据（← mapUtils.js positionJson）
```

### 3.2 分层架构说明

```
┌─────────────────────────────────────────────────────────┐
│                    PixiMap.vue（壳组件）                   │
│  职责：模板、插槽、组装 composables、注册图层              │
└────────────────────────┬────────────────────────────────┘
                         │ 使用
┌────────────────────────▼────────────────────────────────┐
│                  Composables 层                          │
│  usePixiEngine / useMapInteraction / useMapSync ...      │
│  职责：管理 Vue 响应式状态与 PIXI 引擎的桥接             │
└────────────────────────┬────────────────────────────────┘
                         │ 调用
┌────────────────────────▼────────────────────────────────┐
│                    Core 层                               │
│  PixiEngine / ViewportCamera / CoordinateSystem ...      │
│  职责：纯 JS 类，管理 PIXI 实例、视角、坐标、资源         │
│  特点：无 Vue 依赖，可独立测试                            │
└────────────────────────┬────────────────────────────────┘
                         │ 管理
┌────────────────────────▼────────────────────────────────┐
│                   Layers 层                              │
│  BaseLayer → PolygonLayer / PBSLayer / ShipLayer ...     │
│  职责：各图层独立实现绘制/更新/销毁                       │
│  特点：统一接口，可动态注册/移除                          │
└────────────────────────┬────────────────────────────────┘
                         │ 依赖
┌────────────────────────▼────────────────────────────────┐
│                   Utils 层                               │
│  graphics / color / projection / geometry                │
│  职责：纯函数工具集，无状态、无副作用                     │
└─────────────────────────────────────────────────────────┘
```

**数据流向：**

```
Props/外部数据 → PixiMap.vue → composables → core(Engine) → layers → PIXI渲染
                     ↑                                         │
                     └── 事件回调(点击/hover) ←────────────────┘
```

### 3.3 各模块职责详解

#### 3.3.1 Core 层

**PixiEngine.js — PIXI 应用生命周期管理**

| 职责 | 说明 |
|------|------|
| 创建 PIXI.Application | 接收配置（宽高、背景色、抗锯齿等）创建实例 |
| 管理 rootContainer | 创建根 PIXI.Container，所有图层添加到其下 |
| 图层注册表 | 维护 `Map<string, BaseLayer>` 图层集合 |
| addLayer / removeLayer | 动态注册/移除图层 |
| resize | 更新渲染器和 canvas DOM 尺寸 |
| render | 触发一次渲染（非 autoStart 模式） |
| destroy | 按顺序销毁所有图层 → 容器 → Application |

**ViewportCamera.js — 视角控制**

| 职责 | 说明 |
|------|------|
| 缩放 | zoomAt(scale, centerPoint) — 以指定点为中心缩放 |
| 平移 | panBy(dx, dy) — 相对位移 |
| 重置 | reset() — 恢复到初始视角 |
| 适配 | fitBounds(bounds) — 将视角适配到指定区域 |
| 缩放限制 | minScale / maxScale 边界约束 |
| 状态存储 | 记录 originScale / originPosition 用于重置 |

**CoordinateSystem.js — 坐标系统**

| 职责 | 说明 |
|------|------|
| 投影转换 | 封装 proj4，提供 `lngLatToPixel(lng, lat)` |
| 坐标系初始化 | 根据 mapInfo（Origin, Scale, WKT）初始化变换参数 |
| 旋转变换 | 处理地图 Angle 旋转 |
| 全局坐标 ↔ 本地坐标 | 屏幕坐标与地图坐标互转 |

**TextureManager.js — 纹理资源管理**

| 职责 | 说明 |
|------|------|
| 加载纹理 | 替代 PIXI.Loader.shared，使用实例级 loader |
| 雪碧图解析 | initSpritesheet() 解析 60 帧动画帧 |
| 缓存管理 | 纹理缓存跟随实例，destroy 时统一释放 |
| 船体纹理缓存 | 从 sprite.js 的模块级 Map 迁移到此处 |

#### 3.3.2 Composables 层

**usePixiEngine.js — 引擎生命周期**

| 职责 | 说明 |
|------|------|
| 创建引擎 | onMounted 时创建 PixiEngine 实例 |
| 注册图层 | 根据 props 按需注册图层 |
| 监听变化 | watch props 变化，调用对应图层的 update |
| 销毁清理 | onBeforeUnmount 时调用 engine.destroy() |

**useMapInteraction.js — 交互控制**

| 职责 | 说明 |
|------|------|
| 鼠标交互 | 拖拽平移 + 滚轮缩放 |
| 触摸交互 | 单指拖拽 + 双指缩放 |
| 拖拽状态 | 管理 interactionState（isDragging, isPinching 等） |
| 事件绑定 | 通过 EventManager 绑定，确保可清理 |

**useMapSync.js — 多地图联动**

| 职责 | 说明 |
|------|------|
| 发出同步 | 缩放/平移时 emit changeWheel/changePosition |
| 接收同步 | watch wheelInfo/positionInfo/clickInfo 并应用 |
| 条件控制 | 仅在 `isSynced === true` 时启用 |

**useDialogPosition.js — 弹窗定位**

| 职责 | 说明 |
|------|------|
| 统一计算 | 合并 3 处重复的对话框位置计算逻辑 |
| 边界检测 | 弹窗超出窗口时自动调整位置 |
| 连接线计算 | 计算连接线的角度、长度、起点 |

**useMapData.js — 地图数据加载**

| 职责 | 说明 |
|------|------|
| 异步加载 | 替代同步 XHR，使用 async/await + fetch 或 axios |
| 缓存策略 | sessionStorage 缓存（带日期校验） |
| 错误处理 | 统一的加载失败处理 |

#### 3.3.3 Layers 层

**BaseLayer.js — 图层基类（约定统一接口）**

所有图层继承此基类，必须实现以下方法：

| 方法 | 说明 |
|------|------|
| `name` (getter) | 返回图层唯一标识名 |
| `mount(engine)` | 注册到引擎，接收引擎引用（获取 container、coordinateSystem 等） |
| `update(data)` | 数据变更时重绘（由 composable 的 watch 触发） |
| `unmount()` | 销毁该图层的所有 PIXI 对象和事件监听 |
| `onScaleChange(scale)` | 缩放回调，可选实现（如摄像头/文字保持大小） |
| `onClickThrough(point)` | 点击穿透回调，可选实现 |

**各图层与现有代码的映射：**

| 新图层 | 来源 | 关键绘制函数 |
|--------|------|-------------|
| PolygonLayer | layer.js | drawLayer()（保留三种模式：Hull/Clickable/Merged） |
| PBSLayer | sprite.js | drawPBSs()（含高亮、网格填充纹理、点击回调） |
| ShipSpriteLayer | sprite.js | drawShipSprites()（含进度裁剪、hover 跳动动画、AnimatedSprite） |
| VehicleLayer | sprite.js | drawCarSprites()（车辆图标 + 文字标签） |
| RouteAnimationLayer | sprite.js | drawRouterSprites()（折线 + 箭头 + requestAnimationFrame 动画） |
| MaterialLayer | sprite.js | drawMaterials()（多边形或精灵，动态加载 base64） |
| CameraLayer | camera.js | drawCamera()（图标绘制 + HLS 视频播放） |
| BlockCombLayer | block.js | drawBlockAndCombLines()（总段/预组两类数据） |
| TextLabelLayer | text.js | drawFieldText() / drawFieldTexts()（场地文字标签） |

**关键改造点：**

- 每个图层内部维护自己的 PIXI.Container 子容器
- 每个图层内部维护自己的状态（替代 createXxxState 工厂函数）
- 动画控制器从模块级单例改为图层实例级（RouteAnimationLayer 内部管理）
- 纹理缓存（如 shipTextureCache）从模块级移到 TextureManager 实例上

#### 3.3.4 Dialogs 层

**MapDialog.vue — 弹窗容器**

| 职责 | 说明 |
|------|------|
| 定位渲染 | 通过 useDialogPosition 计算位置 |
| 连接线绘制 | CSS 旋转的 div 模拟连接线 |
| 动态切换 | 根据 clickEventType 通过 `<component :is>` 切换弹窗内容 |

**各业务弹窗（PBSDialog / ShipDialog / MaterialDialog / FieldDialog / DepartmentDialog）**

| 职责 | 说明 |
|------|------|
| 数据展示 | 各自负责自己的 API 调用和数据展示 |
| 插槽暴露 | 保持与现有 slot 接口兼容 |

**CameraVideoDialog.vue**

| 职责 | 说明 |
|------|------|
| 视频播放 | HLS 流 + hls.js/video.js |
| 拖拽功能 | 弹窗拖拽 + zIndex 管理 |

#### 3.3.5 Utils 层

**从 mapUtils.js 1330 行中按职责拆分：**

| 新文件 | 包含函数 | 来源行数 |
|--------|---------|---------|
| bindGraphics.js | createPolygonGraphic, drawDashedPolygon, drawDashedLines | ~200行 |
| bindColor.js | rgbaToPixiColor, getHighContrastRGBA | ~50行 |
| projection.js | lngLatToMercator（封装 proj4） | ~30行 |
| geometry.js | findPolygonCentroid, findPolyVisualCenter, calculateBounds, calculatePathLength, getPointAtDistance, fitPathToView | ~150行 |
| textMeasure.js | getStringLength | ~20行 |

**被移除的内容：**

| 内容 | 迁移去向 |
|------|---------|
| positionJson（300行静态数据） | data/spriteFrames.json 独立文件 |
| resetCoordinateSystem | core/CoordinateSystem.js |
| createSprite | core/TextureManager.js 或相关图层内部 |
| clickThroughTest | core/PixiEngine.js 或相关 composable |

---

## 四、分阶段实施计划

### P0 阶段：修复关键缺陷

> **目标**：不改变架构，仅修复运行时 bug
> **预计工作量**：1-2 天
> **影响范围**：最小化

#### 任务清单

| # | 任务 | 对应问题 | 改动文件 |
|---|------|---------|---------|
| P0-1 | 修复事件监听泄漏 | S1 | index.vue onBeforeUnmount 部分 |
| P0-2 | 同步 XHR → async/await | S2 | index.vue asyncloadMapLayer |
| P0-3 | 修复 nextTick 误用 | M4 | camera.js |
| P0-4 | 统一 import 路径 | S4 | index.vue import 语句 |

**P0-1 详细说明（事件监听泄漏修复）：**

当前问题：
```
// 现在：传入新匿名函数，无法移除
Map.view.removeEventListener(event, () => {});
```

修复方案：
- 在 `bindInteractionEvents` 中将所有事件处理函数保存为命名引用
- 在 `onBeforeUnmount` 中使用相同的引用进行移除
- 或使用 AbortController 的 signal 参数统一管理

**P0-2 详细说明（同步 XHR 替换）：**

当前问题：
```
xhr1.open("POST", url, false); // false = 同步阻塞
```

修复方案：
- 将 `asyncloadMapLayer` 中的两次同步 XHR 改为 `await fetch()` 或 `await axios.post()`
- 保持原有的缓存逻辑不变
- 两次请求改为串行 await（保持原有依赖关系）

---

### P1 阶段：提取核心层

> **目标**：将 PIXI 引擎管理、视角控制、事件管理从 index.vue 中抽离
> **预计工作量**：3-5 天
> **影响范围**：中等

#### 任务清单

| # | 任务 | 说明 |
|---|------|------|
| P1-1 | 创建 `core/EventManager.js` | 提取事件绑定/清理逻辑，解决事件泄漏的根本问题(废弃) |
| P1-2 | 创建 `core/PixiEngine.js` | 提取 PIXI.Application 创建/销毁、rootContainer 管理 |
| P1-3 | 创建 `core/ViewportCamera.js` | 提取缩放/平移/重置逻辑（handleMouseWheel, handlePinchZoom, resetMap 等） |
| P1-4 | 创建 `core/CoordinateSystem.js` | 提取 resetCoordinateSystem、lngLatToMercator、坐标变换 |
| P1-5 | 创建 `core/TextureManager.js` | 提取 loadTextures、initPositionSpritesheet、shipTextureCache |
| P1-6 | 创建 `composables/usePixiEngine.js` | 在 Vue 组件中桥接 PixiEngine 的生命周期 |
| P1-7 | 创建 `composables/useMapInteraction.js` | 桥接 ViewportCamera + DOM 交互事件 |
| P1-8 | 修改 `index.vue` | 使用新的 composables 替代内联逻辑 |

**P1 阶段的关键原则：**

1. **不改变现有绘制函数**：P1 阶段暂不重构各 draw 函数，只抽离引擎和交互层
2. **保持 API 兼容**：index.vue 对外的 props/emits/expose 不变
3. **渐进替换**：在 index.vue 中逐步替换为 composable 调用，确保每一步可验证

---

### P2 阶段：图层插件化 + Composables 拆分

> **目标**：将各绘制模块改造为独立图层插件，index.vue 瘦身到 200 行以内
> **预计工作量**：5-8 天
> **影响范围**：大

#### 任务清单

| # | 任务 | 说明 |
|---|------|------|
| P2-1 | 创建 `layers/BaseLayer.js` | 定义图层统一接口 |
| P2-2 | 改造 `layers/PolygonLayer.js` | 从 layer.js 迁移 drawLayer，改为图层类 |
| P2-3 | 改造 `layers/PBSLayer.js` | 从 sprite.js 迁移 drawPBSs |
| P2-4 | 改造 `layers/ShipSpriteLayer.js` | 从 sprite.js 迁移 drawShipSprites（含动画） |
| P2-5 | 改造 `layers/VehicleLayer.js` | 从 sprite.js 迁移 drawCarSprites |
| P2-6 | 改造 `layers/RouteAnimationLayer.js` | 从 sprite.js 迁移 drawRouterSprites（动画控制器改为实例级） |
| P2-7 | 改造 `layers/MaterialLayer.js` | 从 sprite.js 迁移 drawMaterials |
| P2-8 | 改造 `layers/CameraLayer.js` | 从 camera.js 迁移 drawCamera |
| P2-9 | 改造 `layers/BlockCombLayer.js` | 从 block.js 迁移 drawBlockAndCombLines |
| P2-10 | 改造 `layers/TextLabelLayer.js` | 从 text.js 迁移 drawFieldText / drawFieldTexts |
| P2-11 | 拆分 `utils/` 工具函数 | 从 mapUtils.js 拆分为 4 个独立文件 |
| P2-12 | 提取 `data/spriteFrames.json` | 将 positionJson 独立为数据文件 |
| P2-13 | 创建 `composables/useMapSync.js` | 提取多地图联动逻辑 |
| P2-14 | 创建 `composables/useDialogPosition.js` | 统一 3 处对话框位置计算 |
| P2-15 | 创建 `composables/useMapData.js` | 提取地图数据加载逻辑 |
| P2-16 | 重写 `PixiMap.vue`（原 index.vue） | 使用 composables + 图层注册，瘦身到 ~200 行 |

**P2 阶段图层改造策略：**

每个图层的改造遵循统一模式：

1. 创建图层类继承 BaseLayer
2. 将原 `createXxxState()` 的状态移到类的实例属性
3. 将原 `drawXxx()` 函数的逻辑移到类的 `update()` 方法
4. 将原散落在 index.vue 中的 watch → handler 对应关系移到 composable 中
5. 确保 `unmount()` 中正确销毁所有 PIXI 对象

**P2 阶段图层注册与 watch 的关系：**

现有的 watch 逻辑会转移到 `usePixiEngine.js` composable 中，由 composable 监听 props 变化并调用对应图层的 `update()` 方法。映射关系如下：

| 现有 watch | 对应图层 | update 数据 |
|-----------|---------|------------|
| `watch(() => [NowTabID, isHull])` | 全部图层 | 重新加载底图 + 重绘所有图层 |
| `watch(() => [CarLst])` | VehicleLayer | `props.CarLst` |
| `watch(() => [router])` | RouteAnimationLayer | `props.router` |
| `watch(() => [projectMapLocationInfos])` | ShipSpriteLayer | `props.projectMapLocationInfos` |
| `watch(() => [materialMapLocationInfos])` | MaterialLayer | `props.materialMapLocationInfos` |
| `watch(() => [FieldTextInfos])` | TextLabelLayer | `props.FieldTextInfos` |
| `watch(() => [NowPBSs, ...])` | PBSLayer + CameraLayer | PBS 数据 + 摄像头数据 |
| `watch(() => [feildTextVisible, ...])` | TextLabelLayer + BlockCombLayer | 可见性控制 |
| `watch(() => [colorList])` | PolygonLayer | 颜色数据 |
| `watch(() => [FieldTexts])` | TextLabelLayer | 场地文字数据 |

---

### P3 阶段：弹窗组件化 + 收尾优化

> **目标**：弹窗拆分为独立 Vue 组件，收尾优化
> **预计工作量**：2-3 天
> **影响范围**：中等

#### 任务清单

| # | 任务 | 说明 |
|---|------|------|
| P3-1 | 创建 `dialogs/MapDialog.vue` | 弹窗容器 + 连接线 + 定位 |
| P3-2 | 拆分 5 个业务弹窗组件 | PBSDialog / ShipDialog / MaterialDialog / FieldDialog / DepartmentDialog |
| P3-3 | 创建 `CameraVideoDialog.vue` | 摄像头视频弹窗（含拖拽 + zIndex 管理） |
| P3-4 | 消除路由耦合 | 将 `router.currentRoute.value.path` 分析逻辑改为通过 props 传入业务配置 |
| P3-5 | 清理废弃代码 | 删除注释掉的 PBS 差量更新代码、重复的位置计算、未使用的导出 |
| P3-6 | 删除 `public/js/map/` 副本 | 统一使用 `src/components/pixiMap/` 下的代码 |
| P3-7 | 文件重命名 | `index.vue` → `PixiMap.vue`，更新所有引用 |

---

## 五、迁移策略与注意事项

### 5.1 渐进式迁移原则

1. **每个 PR 可独立部署**：每个阶段（P0-P3）完成后系统应可正常运行
2. **对外接口不变**：整个重构过程中，PixiMap 组件对外的 Props / Emits / Expose / Slots 保持不变
3. **先抽后改**：先将代码原样抽出到新文件，验证功能不变后再优化内部实现
4. **每步可测**：每完成一个任务后进行功能回归测试

### 5.2 关键注意事项

#### 多实例安全

- 所有模块级变量（`animationController`、`shipTextureCache`、`SPRITE_FRAMES`）必须改为实例级
- PixiEngine 的 `destroy()` 必须能彻底释放该实例的所有资源
- 避免使用 `PIXI.Loader.shared`，改为每个引擎实例创建独立的 Loader

#### PIXI.js 版本兼容

- 当前代码使用 PIXI v6 API（`PIXI.Loader.shared`、`renderer.plugins.interaction`）
- 如果后续升级 PIXI v7+，需要注意 Loader 和 InteractionManager 的 API 变化
- 重构时在 TextureManager 和 EventManager 中做好 API 隔离

#### 事件回调传递

- 现有绘制函数通过参数传入回调函数（如 `PBSOnClick`、`materialOnClick`）
- 重构后改为图层内部通过引擎的事件总线发布事件，composable 负责监听和处理
- 事件命名规范：`layer:${layerName}:${eventType}`，如 `layer:pbs:click`

#### 动画帧管理

- `RouteAnimationLayer` 中的 requestAnimationFrame 必须绑定到实例
- `unmount()` 时必须取消 requestAnimationFrame
- 船体 hover 动画同理

#### 弹窗插槽兼容

- 现有组件通过 `v-slot:default` 和 `v-slot:Header` 暴露数据
- 重构后弹窗组件需要保持相同的 slot 接口
- 可使用 `provide/inject` 在 MapDialog 和具体弹窗之间传递上下文

### 5.3 测试策略

| 阶段 | 测试重点 |
|------|---------|
| P0 | 验证事件泄漏修复（DevTools Memory 快照对比）、异步加载功能正常 |
| P1 | 验证缩放/平移/重置/触摸交互功能不变，多地图联动正常 |
| P2 | 逐个图层验证绘制结果一致、点击交互正常、动画效果不变 |
| P3 | 弹窗显示/定位/连接线/关闭功能正常，插槽数据传递正确 |

### 5.4 风险与应对

| 风险 | 应对措施 |
|------|---------|
| 重构过程中引入视觉差异 | 每完成一个图层迁移后截图对比 |
| 性能退化（新增类实例开销） | Profile 对比重构前后的 FPS 和内存占用 |
| 多实例场景遗漏 | 在测试页面同时渲染 2 个 PixiMap 实例验证 |
| 插槽接口不兼容 | 记录所有使用 PixiMap 的父组件，逐个验证 |

---

## 六、验证清单

重构完成后需逐项验证的功能点：

### 基础功能

- [ ] 普通底图模式加载并渲染正确
- [ ] 船体底图（Hull）模式加载并渲染正确
- [ ] 鼠标滚轮缩放正常（含缩放中心点）
- [ ] 鼠标拖拽平移正常
- [ ] 触摸屏双指缩放正常
- [ ] 触摸屏单指拖拽正常
- [ ] 重置视角按钮功能正常
- [ ] 窗口 resize 后画布自适应

### 图层绘制

- [ ] 多边形底图三种模式（Hull/Clickable/Merged）渲染正确
- [ ] 总段/预组线段显示正确
- [ ] 场地文字标签位置和颜色正确
- [ ] PBS 泊位多边形渲染正确（含网格填充纹理）
- [ ] PBS 高亮边框正确
- [ ] 船体精灵显示正确（含进度裁剪）
- [ ] 船体 hover 跳动动画正常
- [ ] 船体 60 帧位置动画正常
- [ ] 车辆图标显示正确
- [ ] 路径规划折线和箭头渲染正确
- [ ] 路径车辆动画正常
- [ ] 物资多边形/精灵显示正确
- [ ] 摄像头图标显示正确
- [ ] 摄像头缩放时保持图标大小不变
- [ ] 文字缩放时保持大小不变

### 交互事件

- [ ] PBS 点击 → 查询详情 → 显示弹窗正确
- [ ] 船舶点击 → 查询详情 → 显示弹窗正确
- [ ] 物资点击 → 查询详情 → 显示弹窗正确
- [ ] 场地 hover → 场地弹窗正确
- [ ] 部门标记点击 → 考勤弹窗正确
- [ ] 摄像头点击 → 视频弹窗正确
- [ ] 视频 HLS 播放正常
- [ ] 弹窗连接线位置和角度正确
- [ ] 弹窗超出窗口边界时自动调整
- [ ] 弹窗关闭后状态正确清理
- [ ] 摄像头视频弹窗拖拽正常
- [ ] 摄像头视频弹窗 zIndex 排序正常
- [ ] Hull 模式场地点击 → 高亮边框 + emit showModal

### 多地图联动

- [ ] 缩放同步（changeWheel emit 和 watch）
- [ ] 平移同步（changePosition emit 和 watch）
- [ ] 点击同步（changeClick emit 和 watch）

### 数据更新

- [ ] props.CarLst 变化 → 车辆图层重绘
- [ ] props.router 变化 → 路径图层重绘
- [ ] props.projectMapLocationInfos 变化 → 船体图层重绘
- [ ] props.materialMapLocationInfos 变化 → 物资图层重绘
- [ ] props.NowPBSs 变化 → PBS 图层重绘
- [ ] props.colorList 变化 → 底图颜色更新
- [ ] props.FieldTexts 变化 → 场地文字更新
- [ ] 可见性控制（feildTextVisible / feildBlockVisible / feildCombVisible）

### 性能与资源

- [ ] 组件销毁后无内存泄漏（DevTools Memory 快照对比）
- [ ] 组件销毁后无残留事件监听（DevTools Event Listeners 检查）
- [ ] 多实例场景（同一页面 2+ 个 PixiMap）正常运行、互不干扰
- [ ] sessionStorage 缓存功能正常
- [ ] 对外接口不变：Props / Emits / Expose / Slots 保持兼容

---

## 附录 A：Props 归类与图层映射

将现有 27 个 Props 按功能归类，便于理解各 prop 对应哪个图层：

| 分类 | Props | 对应图层/模块 |
|------|-------|-------------|
| **画布配置** | mapObj, NowTabID, mapHeightZoom | PixiEngine |
| **底图控制** | isHull, mapLayerInfos, mapOriginSize, fieldClickable, save, saveName | PolygonLayer + useMapData |
| **PBS 相关** | NowPBSs, NowLightPBSsID, showLightPBSs, NowTab, NowList, showPlan | PBSLayer |
| **船体相关** | projectMapLocationInfos, projectImgLst, showHullDialogData | ShipSpriteLayer |
| **车辆/路径** | CarLst, router, drawRouter | VehicleLayer + RouteAnimationLayer |
| **物资相关** | materialMapLocationInfos | MaterialLayer |
| **摄像头** | cameraLst, ShouldDrawCamera | CameraLayer |
| **文字/线段** | FieldTexts, FieldTextInfos, FieldInfos, feildTextVisible, feildBlockVisible, feildCombVisible | TextLabelLayer + BlockCombLayer |
| **总段/预组** | blockInfoLst, combInfoLst | BlockCombLayer |
| **联动同步** | isSynced, wheelInfo, positionInfo, clickInfo | useMapSync |
| **视觉控制** | colorList, oneDefaultColor, Clickable, NowShowViewName | PolygonLayer |
| **UI 控制** | resetMapBtnShow, resetMapBtnTop, resetMapBtnLeft, APITimerSetting, mapHigherParam | PixiMap.vue |

---

## 附录 B：现有函数迁移去向对照表

### index.vue 中的函数迁移

| 现有函数 | 行数 | 迁移目标 |
|---------|------|---------|
| initialize() | 774-1302 | core/PixiEngine.js + composables/usePixiEngine.js |
| bindInteractionEvents() | 946-1047 | composables/useMapInteraction.js |
| handleMouseMove() | 1069-1100 | composables/useMapInteraction.js |
| handleMouseWheel() | 1108-1141 | composables/useMapInteraction.js |
| handlePinchZoom() | 1149-1186 | composables/useMapInteraction.js |
| calculateScaleTransform() | 1324-1338 | core/ViewportCamera.js |
| adjustElementsOnScale() | 1308-1318 | core/ViewportCamera.js（onScaleChange 回调） |
| loadTextures() | 1226-1301 | core/TextureManager.js |
| initPositionSpritesheet() | 533-621 | core/TextureManager.js |
| asyncloadMapLayer() | 1394-1625 | composables/useMapData.js |
| asyncloadMapLayerHull() | 1345-1389 | composables/useMapData.js |
| resetMap() | 2150-2227 | core/ViewportCamera.js reset() |
| calculateDialogPosition() | 886-927 | composables/useDialogPosition.js |
| adjustDialogAndLine() | 1710-1752 | composables/useDialogPosition.js（合并） |
| PBSOnClick() | 1849-1954 | composables/usePixiEngine.js（事件处理） |
| shipSpritesOnClick() | 2078-2109 | composables/usePixiEngine.js（事件处理） |
| materialOnClick() | 2024-2072 | composables/usePixiEngine.js（事件处理） |
| departmentSpritesOnClick() | 2111-2144 | composables/usePixiEngine.js（事件处理） |
| onHullFieldClick() | 1798-1843 | composables/usePixiEngine.js（事件处理） |
| handleFieldMouseMove() | 820-838 | composables/usePixiEngine.js（事件处理） |
| createHighlightBorder() | 1661-1682 | utils/bindGraphics.js |
| clearBorderList() | 1688-1702 | utils/bindGraphics.js |
| resetDialogState() | 1757-1768 | composables/useDialogPosition.js |
| closeDialogsAndCleanup() | 1191-1219 | composables/useDialogPosition.js |
| dragAble() / touchstartDragAble() | 684-742 | dialogs/CameraVideoDialog.vue |
| changePlace() | 748-766 | dialogs/CameraVideoDialog.vue |
| deleteCameraLst() | 1642-1652 | dialogs/CameraVideoDialog.vue |
| 全部 watch | 2268-2641 | composables/usePixiEngine.js（按图层分发） |
| onMounted / onBeforeUnmount | 2649-2808 | composables/usePixiEngine.js |

### mapUtils.js 中的函数迁移

| 现有函数 | 迁移目标 |
|---------|---------|
| lngLatToMercator | utils/projection.js |
| resetCoordinateSystem | core/CoordinateSystem.js |
| createPolygonGraphic | utils/bindGraphics.js |
| createSprite | core/TextureManager.js |
| drawDashedPolygon | utils/bindGraphics.js |
| drawDashedLines | utils/bindGraphics.js |
| clickThroughTest | core/PixiEngine.js |
| findPolygonCentroid | utils/geometry.js |
| findPolyVisualCenter | utils/geometry.js |
| calculateBounds | utils/geometry.js |
| calculatePathLength | utils/geometry.js |
| getPointAtDistance | utils/geometry.js |
| fitPathToView | utils/geometry.js |
| rgbaToPixiColor | utils/bindColor.js |
| getHighContrastRGBA | utils/bindColor.js |
| getStringLength | utils/textMeasure.js |
| positionJson | data/spriteFrames.json |

### sprite.js 中的函数迁移

| 现有函数 | 迁移目标 |
|---------|---------|
| createSpriteState() | ShipSpriteLayer / PBSLayer / VehicleLayer / RouteAnimationLayer / MaterialLayer 各自内部状态 |
| drawShipSprites() | layers/ShipSpriteLayer.js update() |
| drawCarSprites() | layers/VehicleLayer.js update() |
| drawRouterSprites() | layers/RouteAnimationLayer.js update() |
| drawPBSs() | layers/PBSLayer.js update() |
| drawMaterials() | layers/MaterialLayer.js update() |
| stopAnimation() | layers/RouteAnimationLayer.js unmount() |
| animationController | layers/RouteAnimationLayer.js 实例属性 |
| shipTextureCache | core/TextureManager.js |

### 其他模块迁移

| 文件 | 迁移目标 |
|------|---------|
| camera.js drawCamera + createCameraLstState | layers/CameraLayer.js |
| layer.js drawLayer + createMapLayerState | layers/PolygonLayer.js |
| block.js drawBlockAndCombLines + createBlockCombState | layers/BlockCombLayer.js |
| text.js drawFieldText + drawFieldTexts + createTextState | layers/TextLabelLayer.js |
| text.js calculateDialogPosition | composables/useDialogPosition.js（合并） |
