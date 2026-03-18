/**
 * ViewportCamera.js — 视角控制（缩放 / 平移 / 重置）
 *
 * 职责：
 * - 以指定屏幕坐标为中心缩放（zoomAt）
 * - 绝对 / 相对平移（panTo / panBy）
 * - 恢复初始视角（reset）
 * - 维护 minScale / maxScale 限制
 * - 通过 onScaleChange 回调通知外部调整图层元素大小
 *
 * 特点：无 Vue 依赖，无 DOM 事件绑定，可独立测试
 * 事件绑定由 composables/useMapInteraction.js 负责
 */

export class ViewportCamera {
  /**
   * @param {PIXI.Container} container   - 受控容器（mapContainer）
   * @param {object}         [options]
   * @param {number}  [options.initialScale=1]
   * @param {number}  [options.initialX=0]
   * @param {number}  [options.initialY=0]
   * @param {number}  [options.minScale=0.1]
   * @param {number}  [options.maxScale=15.0]
   * @param {Function} [options.onScaleChange]  - 缩放变化回调 (newScale) => void
   */
  constructor(container, options = {}) {
    /** @type {PIXI.Container|null} */
    this._container = container;

    /** 当前缩放比 */
    this.currentScale = options.initialScale ?? 1;

    /** 缩放下限 */
    this.minScale = options.minScale ?? 0.1;

    /** 缩放上限 */
    this.maxScale = options.maxScale ?? 15.0;

    // 初始视角（用于 reset）
    this._originScale = options.initialScale ?? 1;
    this._originX = options.initialX ?? 0;
    this._originY = options.initialY ?? 0;

    /** 缩放变化时的回调，用于调整不随地图缩放的元素（文字、摄像头图标等） */
    this._onScaleChange = options.onScaleChange ?? null;
  }

  // --------------------------------------------------
  // 原点管理
  // --------------------------------------------------

  /**
   * 记录当前视角为"重置原点"，并立即应用到容器
   * @param {number} scale
   * @param {number} x
   * @param {number} y
   */
  setOrigin(scale, x, y) {
    this._originScale = scale;
    this._originX = x;
    this._originY = y;
    this._applyTransform(scale, x, y);
  }

  // --------------------------------------------------
  // 变换操作
  // --------------------------------------------------

  /**
   * 以屏幕坐标 mousePos 为中心缩放到 newScale
   *
   * 对应 index.vue: calculateScaleTransform() + container.scale/position 赋值
   *
   * @param {number} newScale       - 目标缩放比（会被 minScale/maxScale 截断）
   * @param {{ x: number, y: number }} mousePos - 屏幕空间中的缩放中心点
   * @returns {{ scale: number, position: { x: number, y: number } }} 实际应用的变换
   */
  zoomAt(newScale, mousePos) {
    const clampedScale = Math.max(
      this.minScale,
      Math.min(this.maxScale, newScale)
    );

    // 保持鼠标下方的世界坐标不变（calculateScaleTransform 逻辑）
    const tempX =
      (-this._container.position.x + mousePos.x) / this.currentScale;
    const tempY =
      (-this._container.position.y + mousePos.y) / this.currentScale;

    const newX = -(tempX * clampedScale - mousePos.x);
    const newY = -(tempY * clampedScale - mousePos.y);

    this._applyTransform(clampedScale, newX, newY);
    this._onScaleChange?.(clampedScale);

    return { scale: clampedScale, position: { x: newX, y: newY } };
  }

  /**
   * 平移到绝对坐标
   * @param {number} x
   * @param {number} y
   */
  panTo(x, y) {
    this._container.position.set(x, y);
  }

  /**
   * 相对平移
   * @param {number} dx
   * @param {number} dy
   */
  panBy(dx, dy) {
    this._container.position.set(
      this._container.position.x + dx,
      this._container.position.y + dy
    );
  }

  /**
   * 重置到 setOrigin 记录的初始视角
   *
   * 对应 index.vue: resetMap() 中的 pivot/scale/position 重置部分
   *
   * @returns {{ scale: number, position: { x: number, y: number } }}
   */
  reset() {
    this._container.pivot.set(0, 0);
    this._applyTransform(this._originScale, this._originX, this._originY);
    this._onScaleChange?.(this._originScale);

    return {
      scale: this._originScale,
      position: { x: this._originX, y: this._originY },
    };
  }

  // --------------------------------------------------
  // 回调注册
  // --------------------------------------------------

  /**
   * 注册缩放变化回调
   * 用于调整不随地图缩放的元素（如文字标签、摄像头图标保持固定大小）
   *
   * 对应 index.vue: adjustElementsOnScale()
   *
   * @param {(newScale: number) => void} fn
   */
  setOnScaleChange(fn) {
    this._onScaleChange = fn;
  }

  // --------------------------------------------------
  // 只读状态访问
  // --------------------------------------------------

  /** 当前容器的位置 */
  get position() {
    return {
      x: this._container?.position.x ?? this._originX,
      y: this._container?.position.y ?? this._originY,
    };
  }

  /** 初始缩放比（reset 时的目标值） */
  get originScale() {
    return this._originScale;
  }

  // --------------------------------------------------
  // 生命周期
  // --------------------------------------------------

  destroy() {
    this._container = null;
    this._onScaleChange = null;
  }
}
