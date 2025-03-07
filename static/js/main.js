/**
 * 主应用入口 - 整合所有组件
 */
import apiService from './utils/apiService.js';
import stockChart from './components/stockChart.js';
import stockSearch from './components/stockSearch.js';
import stockFilter from './components/stockFilter.js';
import loadingIndicator from './components/loadingIndicator.js';

/**
 * 应用主类
 */
class StockApp {
    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('初始化股票应用...');
            
            // 初始化加载指示器
            loadingIndicator.init();
            loadingIndicator.show();
            
            // 初始化股票搜索
            stockSearch.init();
            
            // 将搜索实例设置为全局变量，以便过滤器组件访问股票数据库
            window.stockSearchInstance = stockSearch;
            
            // 初始化过滤器
            stockFilter.init(stockSearch.stockDatabase);
            
            // 初始化股票图表
            await stockChart.init();
            
            console.log('应用初始化完成');
            loadingIndicator.hide();
        } catch (error) {
            console.error('应用初始化失败:', error);
            Swal.fire({
                icon: 'error',
                title: '初始化失败',
                text: '应用加载失败，请刷新页面重试'
            });
            loadingIndicator.hide();
        }
    }
}

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new StockApp();
    app.init();
}); 