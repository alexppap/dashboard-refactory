/**
 * PixiEngine.js — PIXI 应用生命周期管理
 *
 * 职责：
 * - 创建 / 销毁 PIXI.Application
 * - 管理 rootContainer（所有图层的根容器）
 * - 维护图层注册表（addLayer / removeLayer）
 * - 暴露 resize / render 方法
 *
 * 特点：无 Vue 依赖，可独立测试
 */

export class PixiEngine {
  /**
   * @param {object} options - PIXI.Application 配置
   * @param {number}  options.width           - 画布宽度
   * @param {number}  options.height          - 画布高度
   * @param {number}  [options.backgroundColor=0x062947]
   * @param {boolean} [options.antialias=false]
   * @param {boolean} [options.autoStart=false]
   */
  constructor(options = {}) {
    /** @type {PIXI.Application|null} */
    this.app = null;

    /** @type {PIXI.Container|null} 根容器，所有图层挂载于此 */
    this.container = null;

    /** @type {Map<string, object>} 图层注册表 */
    this._layers = new Map();

    this._options = {
      width: options.width || 100,
      height: options.height || 100,
      backgroundColor: options.backgroundColor ?? 0x062947,
      antialias: options.antialias ?? false,
      autoStart: options.autoStart ?? false,
    };
  }

  /**
   * 初始化引擎：创建 PIXI.Application 并挂载到指定 DOM 容器
   * @param {string} containerId - 目标 DOM 元素的 id
   * @returns {boolean} 是否初始化成功
   */
  init(containerId) {
    const PIXI = window.PIXI;
    if (!PIXI) {
      console.error('[PixiEngine] window.PIXI 未找到，请确认 PIXI 已在全局挂载');
      return false;
    }

    // 创建 PIXI.Application
    this.app = new PIXI.Application(this._options);

    // 挂载 canvas 到 DOM
    const containerEl = document.getElementById(containerId);
    if (!containerEl) {
      console.error(`[PixiEngine] 未找到 ID 为 "${containerId}" 的容器元素`);
      this.app.destroy(true);
      this.app = null;
      return false;
    }
    containerEl.appendChild(this.app.view);

    // 创建根场景容器
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    this.container.interactive = true;
    this.app.stage.addChild(this.container);

    return true;
  }

  // --------------------------------------------------
  // 图层注册表
  // --------------------------------------------------

  /**
   * 注册图层
   * @param {string} name  - 图层唯一名称
   * @param {object} layer - 图层实例（应实现可选的 destroy() 方法）
   */
  addLayer(name, layer) {
    if (this._layers.has(name)) {
      console.warn(`[PixiEngine] 图层 "${name}" 已存在，将被覆盖`);
      this.removeLayer(name);
    }
    this._layers.set(name, layer);
  }

  /**
   * 移除并销毁图层
   * @param {string} name - 图层名称
   */
  removeLayer(name) {
    const layer = this._layers.get(name);
    if (!layer) return;
    layer.destroy?.();
    this._layers.delete(name);
  }

  /**
   * 获取图层
   * @param {string} name
   * @returns {object|undefined}
   */
  getLayer(name) {
    return this._layers.get(name);
  }

  // --------------------------------------------------
  // 渲染 & 尺寸
  // --------------------------------------------------

  /**
   * 触发一次手动渲染（非 autoStart 模式使用）
   */
  render() {
    if (this.app && typeof this.app.render === 'function') {
      this.app.render();
    }
  }

  /**
   * 更新渲染器与 canvas DOM 的尺寸
   * @param {number} width
   * @param {number} [height] - 不传则保持现有高度
   */
  resize(width, height) {
    if (!this.app) return;

    const h = height ?? this.app.screen.height;
    this.app.renderer.resize(width, h);

    const view = this.app.view;
    view.style.width = `${width}px`;
    view.style.height = `${h}px`;
  }

  // --------------------------------------------------
  // 生命周期
  // --------------------------------------------------

  /**
   * 销毁引擎：按顺序销毁所有图层 → rootContainer → PIXI.Application
   */
  destroy() {
    // 1. 销毁所有已注册图层
    this._layers.forEach((layer, name) => {
      try {
        layer.destroy?.();
      } catch (e) {
        console.warn(`[PixiEngine] 销毁图层 "${name}" 时出错:`, e);
      }
    });
    this._layers.clear();

    // 2. 销毁根容器
    if (this.container) {
      this.container.removeAllListeners();
      this.container.destroy({ children: true });
      this.container = null;
    }

    // 3. 销毁 PIXI.Application
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }
  }
}
