/**
 * 股票搜索组件 - 负责处理搜索和添加公司功能
 */
import apiService from '../utils/apiService.js';
import stockChart from './stockChart.js';

class StockSearch {
    constructor() {
        this.searchInput = document.getElementById('stockSymbol');
        this.searchResults = document.getElementById('searchResults');
        this.stockDatabase = [];
        
        // 初始化股票数据库
        this.initStockDatabase();
    }

    /**
     * 初始化组件
     */
    init() {
        // 绑定搜索输入事件
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        
        // 绑定回车键事件
        this.searchInput.addEventListener('keypress', this.handleKeyPress.bind(this));
        
        // 绑定点击其他区域隐藏搜索结果事件
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        
        // 绑定热门股票标签点击事件
        document.querySelectorAll('.stock-tag').forEach(tag => {
            tag.addEventListener('click', () => this.handleStockTagClick(tag));
        });
        
        // 绑定添加公司按钮点击事件
        document.querySelector('.add-company button').addEventListener('click', this.addCompany.bind(this));
    }

    /**
     * 初始化股票数据库
     */
    initStockDatabase() {
        this.stockDatabase = [
            // 恒生指数主要成分股
            { code: '0700.HK', name: '腾讯控股', alias: ['腾讯', 'Tencent', 'WeChat'], industry: '科技', tag: ['恒生指数', '科技巨头'] },
            { code: '9988.HK', name: '阿里巴巴-SW', alias: ['阿里', 'Alibaba', '淘宝'], industry: '电商', tag: ['恒生指数', '科技巨头'] },
            { code: '3690.HK', name: '美团-W', alias: ['美团', 'Meituan', '美团点评'], industry: '生活服务', tag: ['恒生指数', '科技巨头'] },
            { code: '9618.HK', name: '京东集团-SW', alias: ['京东', 'JD'], industry: '电商', tag: ['恒生指数', '科技巨头'] },
            { code: '1810.HK', name: '小米集团-W', alias: ['小米', 'Xiaomi'], industry: '科技', tag: ['恒生指数', '科技巨头'] },
            { code: '2097.HK', name: '蜜雪冰城', alias: ['蜜雪', 'mixue', '冰城'], industry: '餐饮', tag: ['新股', '消费'] },
            
            // 金融股
            { code: '0939.HK', name: '建设银行', alias: ['建行', 'CCB'], industry: '银行', tag: ['恒生指数', '金融'] },
            { code: '1398.HK', name: '工商银行', alias: ['工行', 'ICBC'], industry: '银行', tag: ['恒生指数', '金融'] },
            { code: '3988.HK', name: '中国银行', alias: ['中行', 'BOC'], industry: '银行', tag: ['恒生指数', '金融'] },
            { code: '2318.HK', name: '中国平安', alias: ['平安', 'Ping An'], industry: '保险', tag: ['恒生指数', '金融'] },
            
            // 互联网科技
            { code: '9999.HK', name: '网易-S', alias: ['网易', 'NetEase'], industry: '科技', tag: ['恒生指数', '科技'] },
            { code: '9888.HK', name: '百度集团-SW', alias: ['百度', 'Baidu'], industry: '科技', tag: ['科技'] },
            { code: '1024.HK', name: '快手-W', alias: ['快手', 'Kuaishou'], industry: '科技', tag: ['科技'] },
            
            // 新能源车
            { code: '2015.HK', name: '理想汽车-W', alias: ['理想', 'Li Auto'], industry: '汽车', tag: ['新能源车'] },
            { code: '9866.HK', name: '蔚来-SW', alias: ['蔚来', 'NIO'], industry: '汽车', tag: ['新能源车'] },
            { code: '9868.HK', name: '小鹏汽车-W', alias: ['小鹏', 'XPENG'], industry: '汽车', tag: ['新能源车'] },
            
            // 医药生物
            { code: '2269.HK', name: '药明生物', alias: ['药明', 'WuXi Bio'], industry: '医药', tag: ['恒生指数', '医药'] },
            { code: '3759.HK', name: '康龙化成-B', alias: ['康龙化成'], industry: '医药', tag: ['医药'] },
            { code: '2359.HK', name: '药明康德', alias: ['药明康德', 'WuXi AppTec'], industry: '医药', tag: ['医药'] },
            
            // 消费零售
            { code: '2020.HK', name: '安踏体育', alias: ['安踏', 'ANTA'], industry: '体育用品', tag: ['恒生指数', '消费'] },
            { code: '2331.HK', name: '李宁', alias: ['李宁', 'Li Ning'], industry: '体育用品', tag: ['恒生指数', '消费'] },
            { code: '1929.HK', name: '周大福', alias: ['周大福', 'Chow Tai Fook'], industry: '珠宝', tag: ['消费'] },
            
            // 地产
            { code: '0688.HK', name: '中国海外发展', alias: ['中海外', 'COLI'], industry: '房地产', tag: ['恒生指数', '地产'] },
            { code: '1109.HK', name: '华润置地', alias: ['华润置地'], industry: '房地产', tag: ['地产'] },
            { code: '0823.HK', name: '领展房产基金', alias: ['领展', 'Link REIT'], industry: '房地产', tag: ['恒生指数', '地产'] },
            
            // 能源
            { code: '0883.HK', name: '中国海洋石油', alias: ['中海油', 'CNOOC'], industry: '能源', tag: ['恒生指数', '能源'] },
            { code: '0857.HK', name: '中国石油股份', alias: ['中石油', 'PetroChina'], industry: '能源', tag: ['恒生指数', '能源'] },
            { code: '0386.HK', name: '中国石油化工股份', alias: ['中石化', 'Sinopec'], industry: '能源', tag: ['恒生指数', '能源'] },
            
            // 其他
            { code: '0388.HK', name: '香港交易所', alias: ['港交所', 'HKEX'], industry: '金融', tag: ['恒生指数', '金融'] },
            { code: '0941.HK', name: '中国移动', alias: ['中国移动', 'China Mobile'], industry: '电信', tag: ['恒生指数', '电信'] },
            { code: '0762.HK', name: '中国联通', alias: ['联通', 'China Unicom'], industry: '电信', tag: ['恒生指数', '电信'] }
        ];
    }

    /**
     * 处理搜索输入事件
     */
    handleSearchInput() {
        const query = this.searchInput.value.toLowerCase().trim();
        if (query.length < 1) {
            this.searchResults.style.display = 'none';
            return;
        }

        // 获取查询的拼音
        const queryPinyin = pinyinPro.pinyin(query, { toneType: 'none', type: 'array' }).join('').toLowerCase();

        // 对每个股票进行评分
        const scoredMatches = this.stockDatabase.map(stock => {
            let score = 0;
            let matchReason = [];

            // 检查股票代码
            if (stock.code.toLowerCase().includes(query)) {
                score += 100;
                matchReason.push('股票代码匹配');
            }

            // 检查公司名称
            if (stock.name.toLowerCase().includes(query)) {
                score += 90;
                matchReason.push('公司名称匹配');
            }

            // 检查别名
            const aliasMatch = stock.alias.find(alias => 
                alias.toLowerCase().includes(query)
            );
            if (aliasMatch) {
                score += 80;
                matchReason.push('常用名称匹配');
            }

            // 检查拼音匹配
            const namePinyin = pinyinPro.pinyin(stock.name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
            if (namePinyin.includes(queryPinyin)) {
                score += 70;
                matchReason.push('拼音匹配');
            }

            // 检查行业
            if (stock.industry.toLowerCase().includes(query)) {
                score += 60;
                matchReason.push('所属行业匹配');
            }

            // 模糊匹配
            const similarityScore = Math.max(
                this.similarity(query, stock.name.toLowerCase()),
                ...stock.alias.map(alias => this.similarity(query, alias.toLowerCase()))
            );
            if (similarityScore > 0.6) {
                score += similarityScore * 50;
                matchReason.push('模糊匹配');
            }

            return {
                stock,
                score,
                matchReason: matchReason.slice(0, 2).join(', ') // 最多显示两个原因
            };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);

        if (scoredMatches.length > 0) {
            this.searchResults.innerHTML = scoredMatches.map((item, index) => `
                <div class="search-result-item ${index === 0 ? 'suggested' : ''}" data-code="${item.stock.code}">
                    <div>
                        <strong>${item.stock.name}</strong> (${item.stock.code})
                        <small style="color: #666"> - ${item.stock.industry}</small>
                    </div>
                    <span class="match-reason">${item.matchReason}</span>
                </div>
            `).join('');
            this.searchResults.style.display = 'block';

            // 为搜索结果添加点击事件
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => this.handleSearchResultClick(item));
            });
        } else {
            this.searchResults.style.display = 'none';
        }
    }

    /**
     * 处理搜索结果点击事件
     * @param {Element} item - 点击的搜索结果项
     */
    handleSearchResultClick(item) {
        this.searchInput.value = item.dataset.code;
        this.searchResults.style.display = 'none';
        this.addCompany();
    }

    /**
     * 处理股票标签点击事件
     * @param {Element} tag - 点击的股票标签
     */
    handleStockTagClick(tag) {
        this.searchInput.value = tag.dataset.code;
        this.addCompany();
    }

    /**
     * 处理键盘事件
     * @param {Event} e - 键盘事件
     */
    handleKeyPress(e) {
        if (e.key === 'Enter') {
            this.addCompany();
        }
    }

    /**
     * 处理文档点击事件，用于隐藏搜索结果
     * @param {Event} e - 点击事件
     */
    handleDocumentClick(e) {
        if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
            this.searchResults.style.display = 'none';
        }
    }

    /**
     * 添加新公司
     */
    async addCompany() {
        const symbol = this.searchInput.value.trim();
        if (!symbol) {
            Swal.fire({
                icon: 'warning',
                title: '提示',
                text: '请输入股票代码或公司名称'
            });
            return;
        }

        try {
            document.dispatchEvent(new CustomEvent('loading:start'));
            
            const result = await apiService.addCompany(symbol);

            if (result.success) {
                stockChart.addCompany(result.company);
                this.searchInput.value = '';
                Swal.fire({
                    icon: 'success',
                    title: '成功',
                    text: result.message
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '错误',
                    text: result.message
                });
            }
        } catch (error) {
            console.error('添加公司失败:', error);
            Swal.fire({
                icon: 'error',
                title: '错误',
                text: '添加公司失败'
            });
        } finally {
            document.dispatchEvent(new CustomEvent('loading:end'));
        }
    }

    /**
     * 计算字符串相似度
     * @param {string} s1 - 第一个字符串
     * @param {string} s2 - 第二个字符串
     * @returns {number} 相似度分数 (0-1)
     */
    similarity(s1, s2) {
        let longer = s1.length > s2.length ? s1 : s2;
        let shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) return 1.0;
        
        return (longer.length - this.editDistance(longer, shorter)) / parseFloat(longer.length);
    }

    /**
     * 计算编辑距离
     * @param {string} s1 - 第一个字符串
     * @param {string} s2 - 第二个字符串
     * @returns {number} 编辑距离
     */
    editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        let costs = new Array();
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i == 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }
}

// 导出搜索组件实例
const stockSearch = new StockSearch();
export default stockSearch; 