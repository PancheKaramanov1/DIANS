const express = require('express');
const { Pool } = require('pg');
require('dotenv').config(); // To load environment variables from .env

const app = express();
const port = 3001;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

app.get('/data/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        date,
        last_price,
        max,
        min,
        average_price,
        percent_change,
        quantity,
        best_turnover,
        total_turnover,
        code
      FROM public.stock_data
      WHERE code = $1`, [code]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: `Data for code ${code} not found` });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
