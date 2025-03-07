/**
 * 静态版本的股票图表组件
 */
export default class StockChart {
  constructor() {
    this.companies = {};
    this.currentPeriod = "1w";
    this.chartsContainer = document.getElementById("charts");
    this.lastAddedCompany = null;
    this.yahooFinance = window.yahooFinance;
  }

  /**
   * 初始化图表
   */
  async init(companies, period, removeCallback) {
    this.companies = companies || {};
    this.currentPeriod = period || "1w";
    this.removeCallback = removeCallback;

    await this.updateCharts();

    // 添加窗口大小调整监听
    window.addEventListener("resize", this.handleResize.bind(this));

    return this;
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

      // 使用Yahoo Finance API
      const result = await this.yahooFinance.historical(symbol, {
        period1: startDate.toISOString().split("T")[0],
        period2: endDate.toISOString().split("T")[0],
      });

      if (!result || !result.length) {
        throw new Error(`没有找到 ${symbol} 的数据`);
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
    try {
      // 显示加载指示器
      document.querySelector(".loading").style.display = "flex";

      // 清空图表容器
      this.chartsContainer.innerHTML = "";

      // 存储已创建的图表，以便按照特定顺序显示
      const chartElements = {};

      // 获取每个公司的数据并创建图表
      for (const [key, company] of Object.entries(this.companies)) {
        try {
          // 创建图表容器
          const chartDiv = document.createElement("div");
          chartDiv.className = "chart";
          chartDiv.id = `chart-${key}`;

          // 添加删除按钮
          const removeButton = document.createElement("button");
          removeButton.className = "remove-button";
          removeButton.textContent = "×";
          removeButton.onclick = () => this.handleRemoveClick(key);
          chartDiv.appendChild(removeButton);

          try {
            // 获取股票数据
            const stockData = await this.getStockData(
              company.code,
              this.currentPeriod
            );

            // 创建图表配置
            const plotConfig = this.createPlotConfig(stockData, company.name);

            // 存储图表信息
            chartElements[key] = {
              element: chartDiv,
              config: plotConfig,
            };
          } catch (error) {
            // 显示错误信息
            const errorDiv = document.createElement("div");
            errorDiv.className = "error-message";
            errorDiv.textContent = `无法获取 ${company.name} 的数据: ${error.message}`;
            chartDiv.appendChild(errorDiv);

            chartElements[key] = {
              element: chartDiv,
              error: true,
            };
          }
        } catch (error) {
          console.error(`处理公司数据失败 [${key}]:`, error);
        }
      }

      // 按特定顺序添加图表到DOM

      // 1. 如果有最近添加的公司，先添加它
      if (this.lastAddedCompany && chartElements[this.lastAddedCompany]) {
        this.chartsContainer.appendChild(
          chartElements[this.lastAddedCompany].element
        );
        delete chartElements[this.lastAddedCompany];
      }

      // 2. 添加剩余的图表
      for (const key in chartElements) {
        this.chartsContainer.appendChild(chartElements[key].element);
      }

      // 渲染所有图表
      for (const [key, info] of Object.entries(chartElements)) {
        if (!info.error && info.config) {
          window.Plotly.newPlot(
            `chart-${key}`,
            info.config.data,
            info.config.layout,
            {
              responsive: true,
              displayModeBar: "hover",
              scrollZoom: true,
            }
          );
        }
      }
    } catch (error) {
      console.error("更新图表失败:", error);
      Swal.fire({
        icon: "error",
        title: "错误",
        text: "更新图表失败",
      });
    } finally {
      // 隐藏加载指示器
      document.querySelector(".loading").style.display = "none";
    }
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
}
