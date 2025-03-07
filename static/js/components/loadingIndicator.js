/**
 * 加载指示器组件 - 负责处理加载状态显示
 */
class LoadingIndicator {
    constructor() {
        this.loadingElement = document.querySelector('.loading');
    }

    /**
     * 初始化加载指示器
     */
    init() {
        // 添加自定义事件监听器
        document.addEventListener('loading:start', this.show.bind(this));
        document.addEventListener('loading:end', this.hide.bind(this));
    }

    /**
     * 显示加载指示器
     */
    show() {
        this.loadingElement.style.display = 'flex';
    }

    /**
     * 隐藏加载指示器
     */
    hide() {
        this.loadingElement.style.display = 'none';
    }
}

// 导出加载指示器实例
const loadingIndicator = new LoadingIndicator();
export default loadingIndicator; 