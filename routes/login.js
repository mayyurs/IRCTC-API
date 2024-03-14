const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }
  
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting MySQL connection', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (error, results, fields) => {
        connection.release();
  
        if (error) {
          console.error('Error executing MySQL query', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        if (results.length === 0) {
          return res.status(401).json({ status: 'Incorrect username/password provided. Please retry' });
        }
  
        const user_id = results[0].id;
        const token = jwt.sign({ user_id }, secretKey, { expiresIn: '1h' });
  
        res.status(200).json({ status: 'Login successful', user_id, access_token: token });
      });
    });
  });

module.exports = router;
