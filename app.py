from flask import Flask, render_template, jsonify, request
import yfinance as yf
import plotly
import plotly.graph_objs as go
import json
from datetime import datetime, timedelta
import logging
import pandas as pd
import requests
import time
from functools import lru_cache
import random
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')
logging.basicConfig(level=logging.DEBUG)

# 配置 yfinance 的日志级别
yf_logger = logging.getLogger('yfinance')
yf_logger.setLevel(logging.ERROR)

# 股票数据文件路径
STOCKS_FILE = 'stocks.json'

# 从文件加载股票数据，如果文件不存在则使用默认值
def load_stocks():
    if os.path.exists(STOCKS_FILE):
        with open(STOCKS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        'xiaomi': {'code': '1810.HK', 'name': '小米集团'},
        'meituan': {'code': '3690.HK', 'name': '美团'},
        'mixue': {'code': '2097.HK', 'name': '蜜雪冰城'}
    }

# 保存股票数据到文件
def save_stocks(stocks):
    with open(STOCKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stocks, f, ensure_ascii=False, indent=2)

# 初始化股票数据
STOCKS = load_stocks()

def validate_stock_symbol(symbol):
    """验证股票代码并获取公司信息"""
    try:
        # 使用 requests 直接获取数据
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # 构建 Yahoo Finance API URL
        base_url = "https://query1.finance.yahoo.com/v8/finance/chart/"
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        params = {
            'symbol': symbol,
            'period1': int(pd.Timestamp(start_date).timestamp()),
            'period2': int(pd.Timestamp(end_date).timestamp()),
            'interval': '1d'
        }
        
        response = requests.get(base_url + symbol, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                result = data['chart']['result'][0]
                if 'meta' in result and 'symbol' in result['meta']:
                    # 获取公司名称
                    company_name = result['meta'].get('shortName', symbol)
                    return True, company_name
        
        return False, "无效的股票代码"
        
    except Exception as e:
        app.logger.error(f"Error validating stock symbol {symbol}: {str(e)}")
        return False, str(e)

# 添加缓存装饰器
@lru_cache(maxsize=32)
def download_stock_data_cached(symbol, start_date_str, end_date_str, interval='1d'):
    """缓存版本的数据下载函数"""
    try:
        # 随机延迟 1-3 秒，避免请求过快
        time.sleep(random.uniform(1, 3))
        
        # 使用 requests 直接获取数据
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # 构建 Yahoo Finance API URL
        base_url = "https://query1.finance.yahoo.com/v8/finance/chart/"
        params = {
            'symbol': symbol,
            'period1': int(pd.Timestamp(start_date_str).timestamp()),
            'period2': int(pd.Timestamp(end_date_str).timestamp()),
            'interval': interval,
            'events': 'history',
            'includeAdjustedClose': 'true'
        }
        
        app.logger.info(f"Requesting data for {symbol} with params: {params}")
        app.logger.info(f"Request URL: {base_url + symbol}")
        
        response = requests.get(base_url + symbol, params=params, headers=headers, timeout=10)
        
        app.logger.info(f"Response status code: {response.status_code}")
        app.logger.info(f"Response headers: {response.headers}")
        
        if response.status_code == 200:
            data = response.json()
            app.logger.info(f"Response data keys: {data.keys() if data else 'No data'}")
            
            # 检查是否有数据
            if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                result = data['chart']['result'][0]
                app.logger.info(f"Chart result keys: {result.keys() if result else 'No result'}")
                
                # 提取时间戳和价格数据
                timestamps = result['timestamp']
                quotes = result['indicators']['quote'][0]
                
                # 创建 DataFrame
                df = pd.DataFrame({
                    'Open': quotes.get('open', []),
                    'High': quotes.get('high', []),
                    'Low': quotes.get('low', []),
                    'Close': quotes.get('close', []),
                    'Volume': quotes.get('volume', [])
                }, index=pd.to_datetime(timestamps, unit='s'))
                
                if not df.empty:
                    app.logger.info(f"Successfully downloaded data for {symbol}: {len(df)} rows")
                    app.logger.info(f"Data range: {df.index.min()} to {df.index.max()}")
                    return df
                else:
                    app.logger.error(f"DataFrame is empty for {symbol}")
            else:
                app.logger.error(f"No valid data in response for {symbol}")
                app.logger.error(f"Response content: {response.text[:500]}")
        else:
            app.logger.error(f"Failed to get data from Yahoo Finance API for {symbol}")
            app.logger.error(f"Response content: {response.text[:500]}")
        return None
        
    except Exception as e:
        app.logger.error(f"Error downloading data for {symbol}: {str(e)}")
        app.logger.exception("Full exception details:")
        return None

def get_stock_data(symbol, period):
    try:
        app.logger.info(f"Fetching data for {symbol} with period {period}")
        
        # 计算日期范围
        end_date = datetime.now()
        if period == '1w':
            start_date = end_date - timedelta(days=7)
            interval = '1d'
        elif period == '1m':
            start_date = end_date - timedelta(days=30)
            interval = '1d'
        elif period == '6m':
            start_date = end_date - timedelta(days=180)
            interval = '1d'
        elif period == '1y':
            start_date = end_date - timedelta(days=365)
            interval = '1d'
        elif period == '3y':
            start_date = end_date - timedelta(days=1095)
            interval = '1wk'
        
        # 对于新上市公司，使用更早的起始日期来确定实际的第一个交易日
        if symbol == '2097.HK':  # 蜜雪冰城
            # 使用更早的日期以确保捕获到第一个交易日
            start_date = pd.Timestamp('2025-01-01')
            interval = '1d'
            app.logger.info(f"Using earlier start date for {symbol} to determine first trading day")
        
        app.logger.info(f"Requesting data for {symbol} from {start_date} to {end_date} with interval {interval}")
        
        # 使用缓存版本的下载函数
        data = download_stock_data_cached(
            symbol,
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d'),
            interval
        )
        
        if data is not None and not data.empty:
            # 清理数据：删除缺失值和异常值
            original_length = len(data)
            data = data.dropna()
            cleaned_length = len(data)
            
            if cleaned_length < original_length:
                app.logger.warning(f"Removed {original_length - cleaned_length} rows with missing data for {symbol}")
            
            # 记录第一个交易日期
            first_trading_day = data.index.min()
            app.logger.info(f"First trading day for {symbol}: {first_trading_day}")
            
            # 如果是蜜雪冰城，更新实际的上市日期
            if symbol == '2097.HK':
                app.logger.info(f"Actual first trading day for Mixue: {first_trading_day}")
            
            app.logger.info(f"Successfully retrieved {len(data)} rows of data for {symbol}")
            app.logger.info(f"Data range: from {data.index.min()} to {data.index.max()}")
            
            return data
            
        app.logger.error(f"Failed to get data for {symbol}")
        return None
        
    except Exception as e:
        app.logger.error(f"Error in get_stock_data for {symbol}: {str(e)}")
        app.logger.exception("Full exception details:")
        return None

def create_plot(data, company_name, requested_period=None):
    try:
        if data is None or data.empty:
            layout_height = 450
            annotations = [{
                'text': '暂无数据',
                'xref': 'paper',
                'yref': 'paper',
                'x': 0.5,
                'y': 0.5,
                'showarrow': False,
                'font': {'size': 20}
            }]

            # 为不同公司添加说明
            if company_name == '蜜雪冰城':
                annotations.extend([
                    {
                        'text': '蜜雪冰城于2025年3月3日在港交所上市',
                        'xref': 'paper',
                        'yref': 'paper',
                        'x': 0.5,
                        'y': 0.7,
                        'showarrow': False,
                        'font': {'size': 12},
                        'xanchor': 'center'
                    },
                    {
                        'text': '目前仅有上市以来的交易数据',
                        'xref': 'paper',
                        'yref': 'paper',
                        'x': 0.5,
                        'y': 0.6,
                        'showarrow': False,
                        'font': {'size': 12, 'color': 'gray'},
                        'xanchor': 'center'
                    }
                ])

            return json.dumps({
                'data': [], 
                'layout': {
                    'title': f'无法获取{company_name}的数据',
                    'height': layout_height,
                    'annotations': annotations
                }
            })
        
        # 确保日期格式正确
        dates = pd.to_datetime(data.index)
        
        # 检查数据时间范围并添加说明
        data_start_date = dates.min()
        data_end_date = dates.max()
        
        # 准备注释列表
        annotations = [{
            'text': '数据来源: Yahoo Finance',
            'xref': 'paper',
            'yref': 'paper',
            'x': 1,
            'y': -0.2,
            'showarrow': False,
            'font': {'size': 10, 'color': 'gray'},
            'xanchor': 'right'
        }]

        # 获取公司上市日期
        ipo_dates = {
            '蜜雪冰城': pd.Timestamp('2025-03-03'),
            '美团': pd.Timestamp('2018-09-20'),
            '小米集团': pd.Timestamp('2018-07-09')
        }

        # 计算请求的时间范围
        end_date = datetime.now()
        if requested_period == '1w':
            start_date = end_date - timedelta(days=7)
            period_text = '一周'
        elif requested_period == '1m':
            start_date = end_date - timedelta(days=30)
            period_text = '一个月'
        elif requested_period == '6m':
            start_date = end_date - timedelta(days=180)
            period_text = '六个月'
        elif requested_period == '1y':
            start_date = end_date - timedelta(days=365)
            period_text = '一年'
        elif requested_period == '3y':
            start_date = end_date - timedelta(days=1095)
            period_text = '三年'
        else:
            start_date = None
            period_text = None

        # 检查是否需要显示数据范围说明
        if (company_name in ipo_dates and 
            start_date is not None and 
            ipo_dates[company_name] > start_date):
            
            # 计算上市至今的天数
            days_since_ipo = (datetime.now() - ipo_dates[company_name]).days
            
            annotations.append({
                'text': f'注：{company_name}于{ipo_dates[company_name].strftime("%Y年%m月%d日")}上市，目前仅显示上市以来的{days_since_ipo}天交易数据',
                'xref': 'paper',
                'yref': 'paper',
                'x': 0,
                'y': 1.15,
                'showarrow': False,
                'font': {'size': 12, 'color': 'gray'},
                'xanchor': 'left'
            })

        # 创建主图表
        trace_price = go.Scatter(
            x=dates,
            y=data['Close'],
            mode='lines',
            name='收盘价',
            line={'width': 2, 'color': '#1f77b4'}
        )
        
        # 添加成交量图表
        if 'Volume' in data.columns:
            trace_volume = go.Bar(
                x=dates,
                y=data['Volume'],
                name='成交量',
                yaxis='y2',
                marker={'color': '#2ca02c', 'opacity': 0.5}
            )
            traces = [trace_price, trace_volume]
        else:
            traces = [trace_price]
        
        layout = go.Layout(
            title={
                'text': f'{company_name} 股价走势',
                'y': 0.95,  # 将主标题向下移动
                'x': 0.5,
                'xanchor': 'center',
                'yanchor': 'top'
            },
            xaxis={
                'title': '日期',
                'showgrid': True,
                'gridwidth': 1,
                'gridcolor': 'lightgray',
                'type': 'date'
            },
            yaxis={
                'title': '股价 (HKD)',
                'showgrid': True,
                'gridwidth': 1,
                'gridcolor': 'lightgray',
                'side': 'left'
            },
            yaxis2={
                'title': '成交量',
                'showgrid': False,
                'side': 'right',
                'overlaying': 'y',
                'position': 0.95  # 右侧轴的位置
            } if 'Volume' in data.columns else None,
            height=550,  # 增加图表总高度
            margin=dict(l=60, r=60, t=120, b=100),  # 增加上下边距
            plot_bgcolor='white',
            paper_bgcolor='white',
            hovermode='x unified',
            showlegend=True,
            legend={'x': 0.5, 'y': -0.2, 'xanchor': 'center', 'orientation': 'h'},  # 图例居中显示在图表下方
            annotations=annotations
        )
        
        fig = go.Figure(data=traces, layout=layout)
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    except Exception as e:
        app.logger.error(f"Error creating plot for {company_name}: {str(e)}")
        return json.dumps({
            'data': [], 
            'layout': {
                'title': f'创建图表时出错: {str(e)}',
                'height': 450,
                'annotations': [{
                    'text': str(e),
                    'xref': 'paper',
                    'yref': 'paper',
                    'showarrow': False,
                    'font': {'size': 14}
                }]
            }
        })

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_data/<period>')
def get_data(period):
    app.logger.info(f"Received request for period: {period}")
    plots = {}
    for company, info in STOCKS.items():
        try:
            data = get_stock_data(info['code'], period)
            plots[company] = create_plot(data, info['name'], period)
            app.logger.info(f"Successfully created plot for {company}")
        except Exception as e:
            app.logger.error(f"Error processing {company}: {str(e)}")
            plots[company] = json.dumps({
                'data': [], 
                'layout': {
                    'title': f'处理{info["name"]}数据时出错',
                    'height': 450,
                    'annotations': [{
                        'text': str(e),
                        'xref': 'paper',
                        'yref': 'paper',
                        'showarrow': False,
                        'font': {'size': 14}
                    }]
                }
            })
    
    return jsonify(plots)

@app.route('/add_company', methods=['POST'])
def add_company():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').strip().upper()
        
        # 检查股票代码是否已存在
        for info in STOCKS.values():
            if info['code'] == symbol:
                return jsonify({
                    'success': False,
                    'message': '该公司已经在列表中'
                })
        
        # 验证股票代码
        is_valid, company_name = validate_stock_symbol(symbol)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': company_name
            })
        
        # 生成唯一的key
        key = symbol.lower().replace('.', '_').replace('-', '_')
        counter = 1
        original_key = key
        while key in STOCKS:
            key = f"{original_key}_{counter}"
            counter += 1
        
        # 添加新公司
        STOCKS[key] = {
            'code': symbol,
            'name': company_name
        }
        
        # 保存到文件
        save_stocks(STOCKS)
        
        return jsonify({
            'success': True,
            'message': f'成功添加 {company_name}',
            'company': {
                'key': key,
                'code': symbol,
                'name': company_name
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error adding company: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'添加公司时出错: {str(e)}'
        })

@app.route('/remove_company/<key>', methods=['DELETE'])
def remove_company(key):
    try:
        if key in STOCKS:
            company = STOCKS[key]
            del STOCKS[key]
            save_stocks(STOCKS)
            return jsonify({
                'success': True,
                'message': f'成功删除 {company["name"]}'
            })
        return jsonify({
            'success': False,
            'message': '未找到该公司'
        })
    except Exception as e:
        app.logger.error(f"Error removing company: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'删除公司时出错: {str(e)}'
        })

@app.route('/get_companies')
def get_companies():
    return jsonify(STOCKS)

if __name__ == '__main__':
    app.run(debug=True) 