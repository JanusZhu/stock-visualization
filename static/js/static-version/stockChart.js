/**
 * 静态版本的股票图表组件
 */
export default class StockChart {
  constructor() {
    this.companies = {};
    this.currentPeriod = "1w";
    this.chartsContainer = document.getElementById("charts");
    this.lastAddedCompany = null;
    // 确保yahooFinance对象存在
    if (window.yahooFinance) {
      this.yahooFinance = window.yahooFinance;
    } else {
      console.error("Yahoo Finance API未正确加载");
    }
  }

  /**
   * 初始化图表
   */
  async init(companies, period, removeCallback) {
    this.companies = companies;
    this.currentPeriod = period;
    this.removeCallback = removeCallback;

    // 确保Yahoo Finance API可用
    this.initYahooFinance();

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
   * 初始化Yahoo Finance API
   */
  initYahooFinance() {
    // 尝试不同的可能的全局变量名
    if (!this.yahooFinance) {
      if (window.yahooFinance) {
        this.yahooFinance = window.yahooFinance;
      } else if (window.yahooFinance2) {
        this.yahooFinance = window.yahooFinance2;
      } else if (window.YahooFinance2) {
        this.yahooFinance = window.YahooFinance2;
      }
    }

    // 检查是否需要从default属性获取
    if (this.yahooFinance && this.yahooFinance.default && typeof this.yahooFinance.historical !== 'function') {
      this.yahooFinance = this.yahooFinance.default;
    }

    if (!this.yahooFinance || typeof this.yahooFinance.historical !== 'function') {
      console.error("无法初始化Yahoo Finance API，将尝试动态加载");
      // 在这里可以添加动态加载逻辑
    } else {
      console.log("Yahoo Finance API初始化成功");
    }
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
   * 处理窗口大小调整
   */
  handleResize() {
    const charts = document.querySelectorAll(".chart");
    charts.forEach((chart) => {
      if (chart.id && window.Plotly) {
        window.Plotly.relayout(chart.id, {
          width: chart.offsetWidth,
          height: chart.offsetHeight,
        });
      }
    });
  }

  /**
   * 获取股票数据
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

      // 确保API初始化
      this.initYahooFinance();

      if (!this.yahooFinance || typeof this.yahooFinance.historical !== 'function') {
        throw new Error('Yahoo Finance API不可用，请检查网络连接或尝试刷新页面');
      }

      // 查询参数
      const queryOptions = {
        period1: startDate.toISOString().split("T")[0],
        period2: endDate.toISOString().split("T")[0],
        interval: "1d"
      };

      console.log(`尝试获取${symbol}的历史数据`, queryOptions);

      // 尝试获取数据
      let result;
      try {
        // 尝试方法1
        result = await this.yahooFinance.historical(symbol, queryOptions);
      } catch (error1) {
        console.warn(`方法1获取${symbol}数据失败`, error1);

        // 尝试方法2 - 有些版本的API使用query方法
        try {
          if (typeof this.yahooFinance.query === "function") {
            const queryResult = await this.yahooFinance.query({
              symbols: [symbol],
              quote: ["regularMarketPrice"],
              history: queryOptions,
            });

            if (
              queryResult &&
              queryResult[symbol] &&
              queryResult[symbol].history
            ) {
              result = queryResult[symbol].history;
            } else {
              throw new Error("未找到历史数据");
            }
          } else {
            throw new Error("查询方法不可用");
          }
        } catch (error2) {
          console.warn(`方法2获取${symbol}数据失败`, error2);

          // 尝试方法3 - 尝试使用其他格式的API
          try {
            // 检查版本2与版本3的API差异
            if (window.yahooFinance2) {
              result = await window.yahooFinance2.historical(
                symbol,
                queryOptions
              );
            } else {
              throw new Error("API对象不可用");
            }
          } catch (error3) {
            console.error(`所有方法获取${symbol}数据均失败`, error3);
            throw new Error(`无法获取 ${symbol} 的数据: ${error3.message}`);
          }
        }
      }

      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error(`没有找到 ${symbol} 的有效数据`);
      }

      return result;
    } catch (error) {
      console.error(`获取股票数据失败 [${symbol}]:`, error);
      throw error;
    }
  }

  /**
   * 创建图表配置
   */
  createPlotConfig(data, companyName) {
    // 确保日期格式正确
    const dates = data.map((item) => new Date(item.date));

    // 创建主图表
    const traceCandlestick = {
      x: dates,
      close: data.map((item) => item.close),
      high: data.map((item) => item.high),
      low: data.map((item) => item.low),
      open: data.map((item) => item.open),
      type: "candlestick",
      name: "股价",
      increasing: { line: { color: "#e53935" } },
      decreasing: { line: { color: "#43a047" } },
    };

    // 添加成交量图表
    const traceVolume = {
      x: dates,
      y: data.map((item) => item.volume),
      type: "bar",
      name: "成交量",
      yaxis: "y2",
      marker: {
        color: data.map((item, i) => {
          return i > 0 && item.close > data[i - 1].close
            ? "#e53935"
            : "#43a047";
        }),
        opacity: 0.8,
      },
    };

    // 根据交易量范围自动调整Y轴刻度
    const maxVolume = Math.max(...data.map((item) => item.volume));
    const volumeTickFormat =
      maxVolume > 1000000000 ? ".2s" : maxVolume > 1000000 ? ".1s" : "d";

    const layout = {
      title: {
        text: `${companyName} 股价走势`,
        font: {
          size: 18,
        },
        x: 0.5,
        xanchor: "center",
      },
      xaxis: {
        title: "日期",
        type: "date",
        rangeslider: {
          visible: false,
        },
      },
      yaxis: {
        title: "股价",
        domain: [0.3, 1],
        tickformat: ",.2f",
      },
      yaxis2: {
        title: "成交量",
        domain: [0, 0.25],
        tickformat: volumeTickFormat,
        side: "right",
        overlaying: "y",
      },
      margin: {
        l: 60,
        r: 60,
        t: 80,
        b: 50,
      },
      showlegend: true,
      legend: {
        orientation: "h",
        x: 0.5,
        y: -0.2,
        xanchor: "center",
      },
      annotations: [
        {
          text: "数据来源: Yahoo Finance",
          xref: "paper",
          yref: "paper",
          x: 1,
          y: -0.3,
          showarrow: false,
          font: {
            size: 10,
            color: "gray",
          },
          xanchor: "right",
        },
      ],
      height: 550,
      plot_bgcolor: "white",
      paper_bgcolor: "white",
      hovermode: "closest",
    };

    return {
      data: [traceCandlestick, traceVolume],
      layout: layout,
    };
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
      const promises = Object.entries(this.companies).map(async ([key, company]) => {
        try {
          const data = await this.getStockData(company.code, this.currentPeriod);
          return { key, company, data };
        } catch (error) {
          console.error(`获取${company.name}数据失败:`, error);
          
          // 在错误时创建一个错误占位图表
          this.createErrorPlaceholder(key, company, error.message);
          
          // 返回null表示这个公司处理完成但有错误
          return null;
        }
      });

      // 等待所有请求完成
      const results = await Promise.all(promises);

      // 创建成功获取数据的图表
      results.forEach(result => {
        if (result) { // 跳过null结果（那些已经创建了错误占位的）
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
        confirmButtonText: "确定"
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
    window.Plotly.newPlot(
      `chart-${key}`,
      plotConfig.data,
      plotConfig.layout,
      {
        responsive: true,
        displayModeBar: "hover",
        scrollZoom: true,
      }
    );
  }
}
