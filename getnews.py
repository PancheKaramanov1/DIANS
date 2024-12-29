import requests
import pandas as pd
import yfinance as yf
from bs4 import BeautifulSoup
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import argparse
import json

# Function to fetch news from a website
def fetch_news(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract news headlines from the page (adjust selector based on actual website structure)
    headlines = soup.find_all('h2', class_='news-title')  # Modify as needed
    news_data = [headline.text.strip() for headline in headlines]
    return news_data

# Function to perform sentiment analysis on news data
def analyze_sentiment(news_data):
    analyzer = SentimentIntensityAnalyzer()
    sentiments = []

    for news in news_data:
        score = analyzer.polarity_scores(news)
        sentiment = "positive" if score['compound'] > 0 else "negative" if score['compound'] < 0 else "neutral"
        sentiments.append((news, sentiment))

    return sentiments

# Function to fetch stock data using yfinance and calculate technical indicators
def get_technical_analysis(stock_symbol, period='1mo'):
    stock_data = yf.download(stock_symbol, period=period, progress=False)

    # Calculate Simple Moving Average (SMA)
    stock_data['SMA'] = stock_data['Close'].rolling(window=14).mean()

    # Calculate Exponential Moving Average (EMA)
    stock_data['EMA'] = stock_data['Close'].ewm(span=14, adjust=False).mean()

    # Calculate Relative Strength Index (RSI)
    delta = stock_data['Close'].diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss
    stock_data['RSI'] = 100 - (100 / (1 + rs))

    return stock_data

# Function to combine technical and sentiment analysis for decision making
def analyze_stock(stock_symbol, news_url):
    # Fetch news and analyze sentiment
    news_data = fetch_news(news_url)
    sentiments = analyze_sentiment(news_data)

    # Fetch stock data and calculate technical analysis
    stock_data = get_technical_analysis(stock_symbol)

    # Get the latest technical indicators
    latest_rsi = stock_data['RSI'].iloc[-1]
    latest_sma = stock_data['SMA'].iloc[-1]
    latest_ema = stock_data['EMA'].iloc[-1]

    # Analyze sentiment - count positive and negative sentiments
    positive_sentiment = sum(1 for _, sentiment in sentiments if sentiment == 'positive')
    negative_sentiment = sum(1 for _, sentiment in sentiments if sentiment == 'negative')

    sentiment_decision = "neutral"
    if positive_sentiment > negative_sentiment:
        sentiment_decision = "buy"
    elif negative_sentiment > positive_sentiment:
        sentiment_decision = "sell"

    # Determine technical decision
    technical_decision = "neutral"
    if latest_rsi > 70:
        technical_decision = "sell"
    elif latest_rsi < 30:
        technical_decision = "buy"
    elif latest_sma > latest_ema:
        technical_decision = "buy"
    elif latest_sma < latest_ema:
        technical_decision = "sell"

    # Final decision based on both sentiment and technical analysis
    final_decision = "hold"
    if sentiment_decision == "buy" and technical_decision == "buy":
        final_decision = "buy"
    elif sentiment_decision == "sell" or technical_decision == "sell":
        final_decision = "sell"

    # Prepare the result as a dictionary and return it as JSON
    result = {
        "stock_symbol": stock_symbol,
        "latest_rsi": latest_rsi,
        "sentiment_analysis": sentiments,
        "technical_analysis": {
            "SMA": latest_sma,
            "EMA": latest_ema
        },
        "final_decision": final_decision
    }

    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stock analysis with sentiment and technical indicators.")
    parser.add_argument("--code", required=True, help="Stock symbol for analysis")
    parser.add_argument("--news_url", required=False, default="https://www.mse.mk/en/news/latest", help="URL for news data")
    args = parser.parse_args()

    # Call the analysis function and return the result as JSON
    result = analyze_stock(args.code, args.news_url)

    # Output the result as JSON
    print(json.dumps(result, indent=4))  # Format output with indent for readability
