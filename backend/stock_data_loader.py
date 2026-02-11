import yfinance as yf
import pandas as pd
import os
from datetime import datetime, timedelta

def download_stock_data(symbol, period="1y"):
    """
    Download stock data for a given symbol
    """
    try:
        stock = yf.Ticker(symbol)
        data = stock.history(period=period)
        
        if data.empty:
            print(f"No data found for {symbol}")
            return None
            
        return data
    except Exception as e:
        print(f"Error downloading data for {symbol}: {e}")
        return None

def save_to_csv(data, symbol, output_dir="stock_history_data"):
    """
    Save stock data to CSV file
    """
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        filename = f"{output_dir}/{symbol}_history.csv"
        data.to_csv(filename)
        print(f"Data saved to {filename}")
        return filename
    except Exception as e:
        print(f"Error saving data for {symbol}: {e}")
        return None

def main():
    """
    Main function to download stock data
    """
    # List of stock symbols to download
    symbols = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX",
        "ADBE", "CRM", "ORCL", "INTC", "AMD", "QCOM", "TXN", "AVGO",
        "CSCO", "PYPL", "INTU", "MU", "AMAT", "KLAC", "LRCX", "ADI",
        "MCHP", "MRVL", "WDC", "STX", "NTAP", "HPQ", "DELL", "IBM",
        "ACN", "CTSH", "INFY", "WIT", "HCLTECH", "TCS", "TECHM", "MINDTREE",
        "LTI", "MPHASIS", "PERSISTENT", "COGNIZANT", "DXC", "GARTNER", "CDW",
        "JKHY", "PAYC", "FIS", "FISV", "GPN", "V", "MA", "AXP", "DFS",
        "COF", "SYF", "ALLY", "USB", "WFC", "JPM", "BAC", "C", "GS",
        "MS", "BLK", "SCHW", "TROW", "BEN", "IVZ", "LM", "APAM", "AMG",
        "JHG", "FHI", "BRO", "AON", "MMC", "WLTW", "AJG", "Marsh", "AIG",
        "TRV", "ALL", "PGR", "CNA", "HIG", "CB", "CHUBB", "WRB", "AFG",
        "KMPR", "RLI", "EIG", "AGO", "RGA", "RE", "RNR", "PRA", "KINS",
        "AMSF", "CINF", "EMCI", "FNF", "GNW", "LNC", "MET", "PFG", "PRU",
        "VOYA", "AFL", "UNM", "CNO", "GL", "L", "NWL", "PII", "SNA"
    ]
    
    print(f"Starting download of {len(symbols)} stocks...")
    
    for i, symbol in enumerate(symbols, 1):
        print(f"[{i}/{len(symbols)}] Downloading {symbol}...")
        
        data = download_stock_data(symbol)
        if data is not None:
            save_to_csv(data, symbol)
        
        # Small delay to avoid overwhelming the API
        import time
        time.sleep(0.1)
    
    print("Download completed!")

if __name__ == "__main__":
    main()
