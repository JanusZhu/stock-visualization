/**
 * 静态版本的股票图表组件
 */
export default class StockChart {
  constructor() {
    this.companies = {};
    this.currentPeriod = "1w";
    this.chartsContainer = document.getElementById("charts");
    this.lastAddedCompany = null;
  }

  /**
   * 初始化图表
   */
  async init(companies, period, removeCallback) {
    this.companies = companies;
    this.currentPeriod = period;
    this.removeCallback = removeCallback;

    // 尝试加载图表数据
    try {
      await this.updateCharts();
      this.handleResize();
      window.addEventListener("resize", this.handleResize.bind(this));
      return true;
    } catch (error) {
      console.error("初始化图表失败:", error);
      return false;
    }
  }

  /**
   * 初始化窗口大小调整处理
   */
  handleResize() {
    const charts = document.querySelectorAll(".chart");
    charts.forEach((chart) => {
      if (chart.id) {
        window.Plotly.Plots.resize(chart.id);
      }
    });
  }

  /**
   * 更新时间周期
   */
  async updatePeriod(period) {
    this.currentPeriod = period;
    await this.updateCharts();
  }

  /**
   * 添加公司
   */
  async addCompany(key, companyInfo) {
    this.companies[key] = companyInfo;
    this.lastAddedCompany = key;
    await this.updateCharts();
  }

  /**
   * 移除公司
   */
  async removeCompany(key) {
    if (this.removeCallback) {
      this.removeCallback(key);
    }

    delete this.companies[key];
    if (this.lastAddedCompany === key) {
      this.lastAddedCompany = null;
    }

    await this.updateCharts();
  }

  /**
   * 获取股票数据
   * @param {string} symbol - 股票代码
   * @param {string} period - 时间周期
   * @returns {Promise<Array>} - 股票数据
   */
  async getStockData(symbol, period) {
    try {
      const endDate = new Date();
      let startDate;

      switch (period) {
        case "1w":
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "1m":
          startDate = new Date(endDate);
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "6m":
          startDate = new Date(endDate);
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case "1y":
          startDate = new Date(endDate);
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case "3y":
          startDate = new Date(endDate);
          startDate.setFullYear(endDate.getFullYear() - 3);
          break;
        default:
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 7);
      }

      // 使用直接的Fetch API替代Yahoo Finance库
      // 构建Yahoo Finance查询URL
      const period1 = Math.floor(startDate.getTime() / 1000);
      const period2 = Math.floor(endDate.getTime() / 1000);
      const interval = "1d";

      // 原始Yahoo Finance API URL
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}`;

      // 使用CORS代理
      // 尝试多个CORS代理，以防某个不可用
      const corsProxies = [
        "https://corsproxy.io/?",
        "https://api.allorigins.win/raw?url=",
        "https://cors-anywhere.herokuapp.com/",
      ];

      // 尝试不同的代理
      let response = null;
      let error = null;

      for (const proxy of corsProxies) {
        try {
          const proxyUrl = proxy + encodeURIComponent(yahooUrl);
          console.log(`尝试通过代理获取数据: ${proxy}`);

          response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
          });

          if (response.ok) {
            break; // 如果成功就跳出循环
          }
        } catch (e) {
          error = e;
          console.warn(`代理 ${proxy} 获取数据失败:`, e);
          // 继续尝试下一个代理
        }
      }

      // 如果所有代理都失败了
      if (!response || !response.ok) {
        throw error || new Error(`无法从Yahoo Finance获取数据: ${symbol}`);
      }

      const data = await response.json();

      // 解析API响应
      if (
        !data ||
        !data.chart ||
        !data.chart.result ||
        data.chart.result.length === 0
      ) {
        throw new Error(`没有找到 ${symbol} 的数据`);
      }

      const result = data.chart.result[0];
      const { timestamp, indicators } = result;

      if (
        !timestamp ||
        !indicators ||
        !indicators.quote ||
        indicators.quote.length === 0
      ) {
        throw new Error(`${symbol} 数据格式不正确`);
      }

      const quote = indicators.quote[0];
      const adjclose = indicators.adjclose
        ? indicators.adjclose[0].adjclose
        : null;

      // 转换为与之前格式兼容的数据结构
      const stockData = timestamp
        .map((time, i) => {
          return {
            date: new Date(time * 1000),
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i],
            adjclose: adjclose ? adjclose[i] : quote.close[i],
          };
        })
        .filter((item) => item.open && item.close); // 过滤掉无效数据

      if (stockData.length === 0) {
        throw new Error(`${symbol} 没有有效的交易数据`);
      }

      return stockData;
    } catch (error) {
      console.error(`获取股票数据失败 [${symbol}]:`, error);
      throw error;
    }
  }

  /**
   * 创建图表配置
   */
  createPlotConfig(data, companyName) {
    // 准备数据
    const dates = data.map((item) => item.date);
    const closePrices = data.map((item) => item.close);

    // 计算最低和最高价格以及设置y轴范围
    const maxPrice = Math.max(...data.map((item) => item.high));
    const minPrice = Math.min(...data.map((item) => item.low));
    const yRange = maxPrice - minPrice;

    // 计算成交量数据并调整显示比例
    const volumes = data.map((item) => item.volume);
    const maxVolume = Math.max(...volumes);

    // 根据最大成交量调整比例
    const volumeScale = maxVolume > 0 ? (yRange / maxVolume) * 0.2 : 0;
    const scaledVolumes = volumes.map((vol) => minPrice + vol * volumeScale);

    // 红绿柱设置
    const colors = data.map((item, i) => {
      if (i === 0) return "grey"; // 第一个点
      return item.close >= data[i - 1].close ? "red" : "green";
    });

    // 计算移动平均线数据 (5日和10日)
    const ma5 = this.calculateMA(5, closePrices);
    const ma10 = this.calculateMA(10, closePrices);

    // 计算价格变动百分比
    const firstPrice = closePrices[0];
    const lastPrice = closePrices[closePrices.length - 1];
    const priceChange = lastPrice - firstPrice;
    const priceChangePercent = (priceChange / firstPrice) * 100;

    // 构建图表数据
    const trace1 = {
      x: dates,
      close: closePrices,
      high: data.map((item) => item.high),
      low: data.map((item) => item.low),
      open: data.map((item) => item.open),

      // 图表类型和样式
      increasing: { line: { color: "red" } },
      decreasing: { line: { color: "green" } },
      type: "candlestick",
      name: "价格",
      yaxis: "y1",
    };

    const trace2 = {
      x: dates,
      y: scaledVolumes,
      marker: {
        color: colors,
        opacity: 0.7,
      },
      type: "bar",
      name: "成交量",
      yaxis: "y1",
      showlegend: false,
    };

    const trace3 = {
      x: dates,
      y: ma5,
      type: "scatter",
      mode: "lines",
      line: { color: "blue" },
      name: "5日均线",
      yaxis: "y1",
    };

    const trace4 = {
      x: dates,
      y: ma10,
      type: "scatter",
      mode: "lines",
      line: { color: "purple" },
      name: "10日均线",
      yaxis: "y1",
    };

    const data1 = [trace1, trace2, trace3, trace4];

    // 设置布局
    const layout = {
      dragmode: "zoom",
      margin: {
        r: 10,
        t: 40,
        b: 40,
        l: 60,
      },
      title: {
        text: `${companyName} (${priceChange.toFixed(
          2
        )} / ${priceChangePercent.toFixed(2)}%)`,
        font: {
          size: 18,
        },
        x: 0.05,
        xanchor: "left",
      },
      xaxis: {
        autorange: true,
        type: "date",
        rangeslider: { visible: false },
      },
      yaxis: {
        autorange: true,
        type: "linear",
        domain: [0, 1],
      },
      shapes: [],
      annotations: [],
      legend: {
        orientation: "h",
        y: 1.1,
        yanchor: "bottom",
        x: 0.5,
        xanchor: "center",
      },
    };

    return { data: data1, layout };
  }

  /**
   * 计算移动平均线
   */
  calculateMA(period, data) {
    const result = [];

    // 填充前面的空值
    for (let i = 0; i < period - 1; i++) {
      result.push(null);
    }

    // 计算移动平均线
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }

    return result;
  }

  /**
   * 更新所有图表
   */
  async updateCharts() {
    // 清空图表容器
    this.chartsContainer.innerHTML = "";

    if (Object.keys(this.companies).length === 0) {
      this.chartsContainer.innerHTML = `
        <div class="empty-charts">
          <p>暂无公司数据。请使用上方搜索框添加公司。</p>
        </div>
      `;
      return;
    }

    // 显示加载动画
    const loadingIndicator = document.querySelector(".loading");
    if (loadingIndicator) {
      loadingIndicator.style.display = "flex";
    }

    try {
      // 创建所有图表的promises
      const promises = Object.entries(this.companies).map(
        async ([key, company]) => {
          try {
            const data = await this.getStockData(
              company.code,
              this.currentPeriod
            );
            return { key, company, data };
          } catch (error) {
            console.error(`获取${company.name}数据失败:`, error);

            // 在错误时创建一个错误占位图表
            this.createErrorPlaceholder(key, company, error.message);

            // 返回null表示这个公司处理完成但有错误
            return null;
          }
        }
      );

      // 等待所有请求完成
      const results = await Promise.all(promises);

      // 创建成功获取数据的图表
      results.forEach((result) => {
        if (result) {
          // 跳过null结果（那些已经创建了错误占位的）
          const { key, company, data } = result;
          this.createPlot(key, company, data);
        }
      });
    } catch (error) {
      console.error("更新图表失败:", error);
      // 显示一个全局错误信息
      Swal.fire({
        icon: "error",
        title: "更新图表失败",
        text: `无法更新图表: ${error.message}`,
        confirmButtonText: "确定",
      });
    } finally {
      // 隐藏加载动画
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
    }
  }

  /**
   * 创建错误占位图表
   */
  createErrorPlaceholder(key, company, errorMessage) {
    const chartDiv = document.createElement("div");
    chartDiv.className = "chart";
    chartDiv.id = `chart-${key}`;

    // 添加删除按钮
    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.innerHTML = "×";
    removeButton.onclick = () => this.handleRemoveClick(key);
    chartDiv.appendChild(removeButton);

    // 创建错误信息容器
    const errorDiv = document.createElement("div");
    errorDiv.className = "chart-error";
    errorDiv.innerHTML = `
      <h3>${company.name} (${company.code})</h3>
      <p class="error-message">⚠️ ${errorMessage}</p>
      <p>请尝试刷新页面或稍后再试。</p>
      <button class="retry-button">重试加载</button>
    `;
    chartDiv.appendChild(errorDiv);

    // 添加重试按钮功能
    const retryButton = errorDiv.querySelector(".retry-button");
    retryButton.onclick = async () => {
      // 显示加载中
      errorDiv.innerHTML = "<p>重新加载中...</p>";

      try {
        const data = await this.getStockData(company.code, this.currentPeriod);
        // 移除旧的错误图表
        chartDiv.remove();
        // 创建新图表
        this.createPlot(key, company, data);
      } catch (retryError) {
        // 恢复错误显示
        errorDiv.innerHTML = `
          <h3>${company.name} (${company.code})</h3>
          <p class="error-message">⚠️ ${retryError.message}</p>
          <p>请尝试刷新页面或稍后再试。</p>
          <button class="retry-button">重试加载</button>
        `;
        // 重新绑定重试事件
        errorDiv.querySelector(".retry-button").onclick = () =>
          this.handleRemoveClick(key);
      }
    };

    // 将图表添加到容器
    this.chartsContainer.appendChild(chartDiv);
  }

  /**
   * 处理删除按钮点击事件
   */
  async handleRemoveClick(key) {
    const company = this.companies[key];
    const result = await Swal.fire({
      title: "确认删除",
      text: `确定要删除 ${company.name} 吗？`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });

    if (result.isConfirmed) {
      await this.removeCompany(key);
    }
  }

  /**
   * 创建单个股票图表
   */
  createPlot(key, company, data) {
    // 创建图表容器
    const chartDiv = document.createElement("div");
    chartDiv.className = "chart";
    chartDiv.id = `chart-${key}`;

    // 添加删除按钮
    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.innerHTML = "×";
    removeButton.onclick = () => this.handleRemoveClick(key);
    chartDiv.appendChild(removeButton);

    // 添加到DOM
    this.chartsContainer.appendChild(chartDiv);

    // 创建Plotly图表配置
    const plotConfig = this.createPlotConfig(data, company.name);

    // 渲染图表
    window.Plotly.newPlot(`chart-${key}`, plotConfig.data, plotConfig.layout, {
      responsive: true,
      displayModeBar: "hover",
      scrollZoom: true,
    });
  }
}
