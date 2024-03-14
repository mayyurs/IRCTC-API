const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/api/signup', (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting MySQL connection', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      connection.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email], (error, results, fields) => {
        connection.release();
  
        if (error) {
          console.error('Error executing MySQL query', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        res.status(200).json({ status: 'Account successfully created', user_id: results.insertId });
      });
    });
  });

module.exports = router;
