const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.get('/api/get-latest', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM public.get_latest_for_all_codes()');
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing function:", err.message);
    res.status(500).json({ error: 'Error fetching data from the database' });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
