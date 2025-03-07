/**
 * API服务模块 - 负责处理所有与后端API的通信
 */
class ApiService {
    /**
     * 获取公司列表
     * @returns {Promise<Object>} 公司对象
     */
    async getCompanies() {
        try {
            const response = await fetch('/get_companies');
            return await response.json();
        } catch (error) {
            console.error('获取公司列表失败:', error);
            throw error;
        }
    }

    /**
     * 添加新公司
     * @param {string} symbol - 股票代码或公司名称
     * @returns {Promise<Object>} 响应结果
     */
    async addCompany(symbol) {
        try {
            const response = await fetch('/add_company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symbol })
            });
            return await response.json();
        } catch (error) {
            console.error('添加公司失败:', error);
            throw error;
        }
    }

    /**
     * 删除公司
     * @param {string} key - 公司的键值
     * @returns {Promise<Object>} 响应结果
     */
    async removeCompany(key) {
        try {
            const response = await fetch(`/remove_company/${key}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('删除公司失败:', error);
            throw error;
        }
    }

    /**
     * 获取股票数据
     * @param {string} period - 时间周期（例如：1w, 1m, 6m, 1y, 3y）
     * @returns {Promise<Object>} 股票数据
     */
    async getStockData(period) {
        try {
            const response = await fetch(`/get_data/${period}`);
            return await response.json();
        } catch (error) {
            console.error('获取股票数据失败:', error);
            throw error;
        }
    }
}

// 导出API服务实例
const apiService = new ApiService();
export default apiService; 