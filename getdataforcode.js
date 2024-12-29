const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const technicalIndicators = require('technicalindicators');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function getStockData(code) {
  try {
    const result = await pool.query(
      `SELECT date, last_price FROM public.stock_prices WHERE code = $1 ORDER BY date DESC LIMIT 100;`,
      [code]
    );
    return result.rows.reverse();
  } catch (error) {
    console.error('Error fetching data from database:', error);
    return [];
  }
}

function resampleData(stockData, period) {
  const cutoffDate = new Date();
  
  if (period === '1W') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (period === '1M') {
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);
  }

  return stockData.filter(row => new Date(row.date) >= cutoffDate);
}

async function calculateIndicators(stockData) {
  const prices = stockData.map(row => row.last_price);
  const dates = stockData.map(row => row.date);

  const rsi = technicalIndicators.RSI.calculate({ values: prices, period: 1 });
  const sma = technicalIndicators.SMA.calculate({ values: prices, period: 1 });
  const ema = technicalIndicators.EMA.calculate({ values: prices, period: 1 });

  return {
    dates,
    rsi,
    sma,
    ema,
  };
}

function formatResponse(stockCode, analysis1W, analysis1M) {
  return {
    stockCode: stockCode,
    analysis1W: analysis1W,
    analysis1M: analysis1M,
  };
}

app.get('/stock-analysis/:code', async (req, res) => {
  const stockCode = req.params.code;
  const stockData = await getStockData(stockCode);

  if (stockData.length === 0) {
    return res.status(404).json({ message: `No data found for stock code ${stockCode}` });
  }

  const stockData1W = resampleData(stockData, '1W');
  const analysis1W = stockData1W.length > 0 ? await calculateIndicators(stockData1W) : [];

  const stockData1M = resampleData(stockData, '1M');
  const analysis1M = stockData1M.length > 0 ? await calculateIndicators(stockData1M) : [];

  const response = formatResponse(stockCode, analysis1W, analysis1M);
  return res.json(response);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
