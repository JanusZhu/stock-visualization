/**
 * 股票图表组件 - 负责处理图表的创建、渲染和更新
 */
import apiService from '../utils/apiService.js';

class StockChart {
    constructor() {
        this.companies = {};
        this.currentPeriod = '1w';
        this.chartsContainer = document.getElementById('charts');
        this.lastAddedCompany = null; // 跟踪最近添加的公司
    }

    /**
     * 初始化图表
     */
    async init() {
        try {
            this.companies = await apiService.getCompanies();
            this.updateCharts();
            
            // 添加窗口大小调整监听
            window.addEventListener('resize', this.handleResize.bind(this));
        } catch (error) {
            console.error('初始化图表失败:', error);
            Swal.fire({
                icon: 'error',
                title: '错误',
                text: '初始化图表失败'
            });
        }
    }

    /**
     * 设置时间周期
     * @param {string} period - 时间周期
     */
    setPeriod(period) {
        this.currentPeriod = period;
        this.updateCharts();
    }

    /**
     * 添加公司
     * @param {Object} company - 公司信息
     */
    addCompany(company) {
        this.companies[company.key] = {
            code: company.code,
            name: company.name
        };
        this.lastAddedCompany = company.key; // 记录最近添加的公司
        this.updateCharts();
    }

    /**
     * 删除公司
     * @param {string} key - 公司的键值
     */
    removeCompany(key) {
        delete this.companies[key];
        if (this.lastAddedCompany === key) {
            this.lastAddedCompany = null;
        }
        this.updateCharts();
    }

    /**
     * 处理窗口大小调整事件
     */
    handleResize() {
        const charts = document.querySelectorAll('.chart');
        charts.forEach(chart => {
            if (chart.id) {
                Plotly.relayout(chart.id, {
                    'width': chart.offsetWidth,
                    'height': chart.offsetHeight
                });
            }
        });
    }

    /**
     * 增强图表配置，防止数据重叠
     * @param {Object} plotConfig - 原始图表配置
     * @returns {Object} - 增强后的图表配置
     */
    enhancePlotConfig(plotConfig) {
        if (!plotConfig || !plotConfig.layout) return plotConfig;
        
        // 深拷贝以避免修改原始对象
        const config = JSON.parse(JSON.stringify(plotConfig));
        
        // 增强图表布局配置
        if (!config.layout) config.layout = {};
        
        // 1. 增加图表上下间距
        if (!config.layout.margin) {
            config.layout.margin = {
                l: 50,  // 左边距
                r: 50,  // 右边距
                t: 120, // 顶部边距，增加以避免和标题重叠
                b: 120  // 底部边距，增加以确保X轴标签有足够空间
            };
        } else {
            config.layout.margin.t = Math.max(config.layout.margin.t || 0, 120);
            config.layout.margin.b = Math.max(config.layout.margin.b || 0, 120);
        }
        
        // 2. 优化子图配置，增加K线图和成交量图之间的间距
        if (config.layout.xaxis) {
            config.layout.xaxis.rangeslider = { visible: false }; // 禁用默认的滑块，减少空间占用
        }
        
        if (config.layout.yaxis2) {
            // 确保成交量图有足够高度
            config.layout.yaxis2.domain = [0, 0.25]; // 成交量图占据底部25%的高度
            config.layout.yaxis.domain = [0.3, 1];  // K线图占据顶部70%的高度，中间留出5%的间隙
        }
        
        // 3. 添加额外的布局选项
        config.layout.autosize = true;
        config.layout.showlegend = true;
        config.layout.legend = {
            orientation: 'h',      // 水平排列图例
            y: -0.15,              // 图例位置，位于图表下方
            yanchor: 'top',        // 锚点设置
            xanchor: 'center',     // 水平居中
            x: 0.5                 // 水平居中位置
        };
        
        // 4. 优化图表配置以支持交互和响应式
        if (!config.config) config.config = {};
        config.config = {
            responsive: true,
            displayModeBar: 'hover',  // 仅在悬停时显示工具栏
            scrollZoom: true,         // 启用滚轮缩放
            modeBarButtonsToRemove: ['lasso2d', 'select2d'] // 移除不常用按钮
        };
        
        return config;
    }

    /**
     * 更新所有图表
     */
    async updateCharts() {
        try {
            document.dispatchEvent(new CustomEvent('loading:start'));
            
            const data = await apiService.getStockData(this.currentPeriod);
            
            // 清空图表容器
            this.chartsContainer.innerHTML = '';
            
            // 存储已创建的图表，以便按照特定顺序显示
            const chartElements = {};
            
            // 创建图表
            for (const [key, plots] of Object.entries(data)) {
                if (this.companies[key]) {
                    // 创建图表容器
                    const chartDiv = document.createElement('div');
                    chartDiv.className = 'chart';
                    chartDiv.id = `chart-${key}`;
                    
                    // 添加删除按钮
                    const removeButton = document.createElement('button');
                    removeButton.className = 'remove-button';
                    removeButton.textContent = '×';
                    removeButton.onclick = () => this.handleRemoveClick(key);
                    chartDiv.appendChild(removeButton);
                    
                    // 存储图表元素，而不是直接添加到DOM
                    chartElements[key] = chartDiv;
                }
            }
            
            // 按特定顺序添加图表到DOM
            
            // 1. 如果有最近添加的公司，先添加它
            if (this.lastAddedCompany && chartElements[this.lastAddedCompany]) {
                this.chartsContainer.appendChild(chartElements[this.lastAddedCompany]);
                delete chartElements[this.lastAddedCompany];
            }
            
            // 2. 添加剩余的图表
            for (const key in chartElements) {
                this.chartsContainer.appendChild(chartElements[key]);
            }
            
            // 渲染所有图表
            document.querySelectorAll('.chart').forEach(chart => {
                const key = chart.id.replace('chart-', '');
                if (data[key]) {
                    const plotConfig = JSON.parse(data[key]);
                    
                    // 增强图表配置，防止数据重叠
                    const enhancedConfig = this.enhancePlotConfig(plotConfig);
                    
                    Plotly.newPlot(chart.id, enhancedConfig.data || plotConfig, 
                        enhancedConfig.layout || {}, 
                        enhancedConfig.config || {
                            responsive: true,
                            displayModeBar: false,
                            scrollZoom: false
                        }
                    );
                }
            });
        } catch (error) {
            console.error('更新图表失败:', error);
            Swal.fire({
                icon: 'error',
                title: '错误',
                text: '更新图表失败'
            });
        } finally {
            document.dispatchEvent(new CustomEvent('loading:end'));
        }
    }
    
    /**
     * 处理删除按钮点击事件
     * @param {string} key - 公司的键值
     */
    async handleRemoveClick(key) {
        const company = this.companies[key];
        const result = await Swal.fire({
            title: '确认删除',
            text: `确定要删除 ${company.name} 吗？`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消'
        });
        
        if (result.isConfirmed) {
            try {
                document.dispatchEvent(new CustomEvent('loading:start'));
                
                const response = await apiService.removeCompany(key);
                
                if (response.success) {
                    this.removeCompany(key);
                    Swal.fire({
                        icon: 'success',
                        title: '成功',
                        text: response.message
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '错误',
                        text: response.message
                    });
                }
            } catch (error) {
                console.error('删除公司失败:', error);
                Swal.fire({
                    icon: 'error',
                    title: '错误',
                    text: '删除公司失败'
                });
            } finally {
                document.dispatchEvent(new CustomEvent('loading:end'));
            }
        }
    }
}

// 导出图表组件实例
const stockChart = new StockChart();
export default stockChart; 