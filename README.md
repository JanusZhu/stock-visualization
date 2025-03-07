# 股票价格走势可视化应用

这是一个基于Flask和Plotly的股票价格数据可视化Web应用，专注于展示港股市场的股票价格走势。

## 功能特点

- **多时间周期展示**：支持展示一周、一个月、六个月、一年和三年的股票价格走势
- **行业分类筛选**：提供行业分类标签，方便快速查找特定行业的股票
- **实时搜索**：支持拼音、公司名称、股票代码等多维度搜索
- **响应式设计**：自适应不同屏幕尺寸，提供最佳的用户体验
- **数据丰富**：包含恒生指数主要成分股、热门科技股、新能源车企等30+支港股
- **智能提示**：根据搜索关键词提供相关性排序的搜索结果
- **自定义添加**：支持用户自行添加关注的股票
- **持久化存储**：自动保存用户添加的股票列表

## 技术栈

- **后端**：Flask
- **前端**：HTML + CSS + JavaScript (ES6模块)
- **数据获取**：yfinance API
- **图表绘制**：Plotly.js
- **交互组件**：SweetAlert2
- **中文拼音**：pinyin-pro

## 安装指南

1. 克隆此仓库
   ```bash
   git clone https://github.com/yourusername/stock-visualization.git
   cd stock-visualization
   ```

2. 创建并激活虚拟环境
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Linux/macOS
   source .venv/bin/activate
   ```

3. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

4. 运行应用
   ```bash
   python app.py
   ```

5. 在浏览器中访问
   ```
   http://localhost:5000
   ```

## 使用方法

1. **添加股票**：在顶部输入框中输入股票代码(如"0700.HK")或公司名称(如"腾讯")，然后点击"添加公司"按钮
2. **筛选行业**：点击"行业分类"下的标签可以筛选特定行业的股票
3. **切换时间周期**：点击"时间周期"下的按钮可以查看不同时间范围的股价走势
4. **删除股票**：点击图表右上角的"×"按钮可以删除不需要的股票

## 项目结构

```
├── app.py              # Flask应用主文件
├── requirements.txt    # 项目依赖
├── README.md           # 项目说明
├── stocks.json         # 存储用户添加的股票
├── static/             # 静态资源
│   ├── css/            # CSS样式文件
│   └── js/             # JavaScript文件
│       ├── components/ # 组件模块
│       └── utils/      # 工具模块
└── templates/          # HTML模板
    └── index.html      # 主页面
```

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request对项目进行改进。 