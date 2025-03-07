/**
 * 静态版本主入口文件 - 使用Yahoo Finance API
 */
import StockChart from "./stockChart.js";
import StockSearch from "./stockSearch.js";
import StockFilter from "./stockFilter.js";
import LoadingIndicator from "./loadingIndicator.js";
import { saveToLocalStorage, loadFromLocalStorage } from "./storageService.js";

// 股票数据库 - 相当于后端的stocks.json
const DEFAULT_STOCKS = {
  tencent: {
    code: "0700.HK",
    name: "腾讯控股",
  },
  meituan: {
    code: "3690.HK",
    name: "美团",
  },
  xiaomi: {
    code: "1810.HK",
    name: "小米集团",
  },
};

/**
 * 应用主类
 */
class StockApp {
  constructor() {
    this.companies = {};
    this.currentPeriod = "1w";
    this.loadingIndicator = new LoadingIndicator();
    this.stockChart = new StockChart();
    this.stockSearch = new StockSearch();
    this.stockFilter = new StockFilter();
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      console.log("初始化股票应用...");

      // 初始化加载指示器
      this.loadingIndicator.init();
      this.loadingIndicator.show();

      // 加载保存的公司数据
      this.companies = loadFromLocalStorage("companies") || DEFAULT_STOCKS;

      // 初始化子组件
      this.stockSearch.init(this.addCompany.bind(this));
      this.stockFilter.init(this.stockSearch.stockDatabase);
      await this.stockChart.init(
        this.companies,
        this.currentPeriod,
        this.removeCompany.bind(this)
      );

      // 绑定时间周期切换事件
      this.initPeriodButtons();

      console.log("应用初始化完成");
      this.loadingIndicator.hide();
    } catch (error) {
      console.error("应用初始化失败:", error);
      Swal.fire({
        icon: "error",
        title: "初始化失败",
        text: "应用加载失败，请刷新页面重试",
      });
      this.loadingIndicator.hide();
    }
  }

  /**
   * 初始化时间周期按钮
   */
  initPeriodButtons() {
    const buttons = document.querySelectorAll(".period-buttons .button");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        this.currentPeriod = button.dataset.period;
        this.stockChart.updatePeriod(this.currentPeriod);
      });
    });
  }

  /**
   * 添加公司
   * @param {Object} companyInfo - 公司信息
   */
  addCompany(companyInfo) {
    const key = companyInfo.name.toLowerCase().replace(/\s+/g, "_");
    this.companies[key] = {
      code: companyInfo.code,
      name: companyInfo.name,
    };

    // 保存到localStorage
    saveToLocalStorage("companies", this.companies);

    // 更新图表
    this.stockChart.addCompany(key, companyInfo);
  }

  /**
   * 删除公司
   * @param {string} key - 公司key
   */
  removeCompany(key) {
    delete this.companies[key];

    // 保存到localStorage
    saveToLocalStorage("companies", this.companies);
  }
}

// 在DOM加载完成后初始化应用
document.addEventListener("DOMContentLoaded", () => {
  const app = new StockApp();
  app.init();
});
