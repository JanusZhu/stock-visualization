# 股票价格走势可视化应用 - GitHub Pages静态版本

这是[股票价格走势可视化应用](https://github.com/JanusZhu/stock-visualization)的GitHub Pages静态版本。由于GitHub Pages只支持静态网站托管，所以此版本使用纯前端技术实现，通过浏览器直接调用Yahoo Finance API获取实时股票数据。

## 在线演示

访问: [https://JanusZhu.github.io/stock-visualization/](https://JanusZhu.github.io/stock-visualization/)

## 主要功能

- **多时间周期展示**：支持展示一周、一个月、六个月、一年和三年的股票价格走势
- **行业分类筛选**：提供行业分类标签，方便快速查找特定行业的股票
- **实时搜索**：支持拼音、公司名称、股票代码等多维度搜索
- **响应式设计**：自适应不同屏幕尺寸，提供最佳的用户体验
- **数据持久化**：使用浏览器localStorage保存用户添加的股票列表

## 技术实现

- **前端框架**：纯HTML + CSS + JavaScript (ES6模块)
- **数据来源**：Yahoo Finance API
- **图表绘制**：Plotly.js
- **交互组件**：SweetAlert2
- **中文拼音**：pinyin-pro
- **数据存储**：浏览器localStorage

## 与后端版本区别

相比完整版本，此静态版本：

1. 不需要安装任何服务器环境，可直接在浏览器中运行
2. 数据直接从Yahoo Finance API获取，而非通过Flask后端
3. 使用浏览器localStorage替代服务器上的JSON文件进行数据持久化存储
4. 某些功能可能受到CORS限制，取决于Yahoo Finance API的跨域政策

## 本地运行

由于这是纯静态网站，你可以通过以下方式在本地运行：

1. 克隆此仓库
   ```bash
   git clone https://github.com/JanusZhu/stock-visualization.git
   git checkout gh-pages
   ```

2. 使用任何静态服务器，例如：
   ```bash
   # 如果你有Python
   python -m http.server
   
   # 如果你有Node.js
   npx serve
   ```

3. 在浏览器中访问服务器提供的URL (如 `http://localhost:8000`)

## 回到主项目

要查看完整的带后端的项目版本，请切换到main分支：
```bash
git checkout main
```

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request对项目进行改进。 