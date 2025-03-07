/**
 * 加载指示器组件 - 静态版本
 */
export default class LoadingIndicator {
  constructor() {
    this.loadingElement = document.querySelector(".loading");
  }

  /**
   * 初始化加载指示器
   */
  init() {
    // 确保加载元素存在
    if (!this.loadingElement) {
      console.error("加载指示器元素未找到");
      return;
    }

    // 设置初始样式
    this.hide();
  }

  /**
   * 显示加载指示器
   */
  show() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "flex";
    }
  }

  /**
   * 隐藏加载指示器
   */
  hide() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
    }
  }
}
