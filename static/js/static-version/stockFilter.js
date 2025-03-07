/**
 * 股票过滤器组件 - 静态版本
 */
export default class StockFilter {
  constructor() {
    this.industryTags = [];
    this.activeIndustry = null;
  }

  /**
   * 初始化过滤器
   * @param {Array} stockDatabase - 股票数据库
   */
  init(stockDatabase) {
    // 获取所有行业标签
    this.industryTags = Array.from(
      new Set(stockDatabase.flatMap((stock) => stock.tag))
    );

    // 创建行业分类标签
    this.createIndustryTags();
  }

  /**
   * 创建行业分类标签
   */
  createIndustryTags() {
    const industryTagsDiv = document.getElementById("industryTags");

    // 清空现有标签
    industryTagsDiv.innerHTML = "";

    // 添加行业分类标签
    this.industryTags.forEach((tag) => {
      const tagButton = document.createElement("button");
      tagButton.className = "button industry";
      tagButton.textContent = tag;
      tagButton.dataset.tag = tag;
      tagButton.onclick = () => this.handleIndustryTagClick(tag, tagButton);
      industryTagsDiv.appendChild(tagButton);
    });
  }

  /**
   * 处理行业标签点击事件
   * @param {string} tag - 行业标签
   * @param {Element} button - 点击的按钮元素
   */
  handleIndustryTagClick(tag, button) {
    // 获取所有行业按钮
    const buttons = document.querySelectorAll(".button.industry");

    // 如果当前标签已经是活动状态，则取消选择
    if (this.activeIndustry === tag) {
      button.classList.remove("active");
      this.activeIndustry = null;
      this.resetStockList();
    } else {
      // 移除所有按钮的活动状态
      buttons.forEach((b) => b.classList.remove("active"));

      // 添加当前按钮的活动状态
      button.classList.add("active");
      this.activeIndustry = tag;

      // 过滤股票列表
      this.filterStocksByTag(tag);
    }
  }

  /**
   * 重置股票列表，显示所有热门股票
   */
  resetStockList() {
    const popularStocksDiv = document.getElementById("popularStocks");
    popularStocksDiv.innerHTML = `
            <span class="stock-tag" data-code="0700.HK" data-name="腾讯控股">腾讯控股 (0700.HK)</span>
            <span class="stock-tag" data-code="9988.HK" data-name="阿里巴巴">阿里巴巴 (9988.HK)</span>
            <span class="stock-tag" data-code="9618.HK" data-name="京东集团">京东集团 (9618.HK)</span>
            <span class="stock-tag" data-code="3690.HK" data-name="美团">美团 (3690.HK)</span>
            <span class="stock-tag" data-code="1810.HK" data-name="小米集团">小米集团 (1810.HK)</span>
            <span class="stock-tag" data-code="2097.HK" data-name="蜜雪冰城">蜜雪冰城 (2097.HK)</span>
            <span class="stock-tag" data-code="9999.HK" data-name="网易">网易 (9999.HK)</span>
            <span class="stock-tag" data-code="2269.HK" data-name="药明生物">药明生物 (2269.HK)</span>
        `;

    // 重新绑定点击事件
    this.bindStockTagClickEvents();
  }

  /**
   * 按行业标签过滤股票
   * @param {string} tag - 行业标签
   */
  filterStocksByTag(tag) {
    // 从全局访问 stockDatabase
    const stockDatabase = window.stockSearchInstance
      ? window.stockSearchInstance.stockDatabase
      : [];

    if (stockDatabase.length === 0) {
      console.error("股票数据库未加载");
      return;
    }

    const filteredStocks = stockDatabase.filter((stock) =>
      stock.tag.includes(tag)
    );
    const popularStocksDiv = document.getElementById("popularStocks");

    // 更新显示的股票
    popularStocksDiv.innerHTML = filteredStocks
      .map(
        (stock) => `
            <span class="stock-tag" data-code="${stock.code}" data-name="${stock.name}">
                ${stock.name} (${stock.code})
            </span>
        `
      )
      .join("");

    // 重新绑定点击事件
    this.bindStockTagClickEvents();
  }

  /**
   * 为所有股票标签绑定点击事件
   */
  bindStockTagClickEvents() {
    document.querySelectorAll(".stock-tag").forEach((tag) => {
      tag.addEventListener("click", () => {
        const stockCode = tag.dataset.code;
        const stockName = tag.dataset.name;

        // 查找全局搜索实例并调用其处理方法
        if (window.stockSearchInstance) {
          window.stockSearchInstance.handleStockTagClick(tag);
        } else {
          console.error("全局搜索实例未找到");
        }
      });
    });
  }
}
