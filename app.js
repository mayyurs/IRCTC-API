const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2')

const app = express();
const port = 3000;

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'railway_management'
});

app.use(bodyParser.json());

// Secret key for JWT token
const secretKey = '915df304d5a94030d5569bcd173a9d75f8c3e66794f1814a126118d9fafa3cc5';

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], secretKey);
    req.user_id = decoded.user_id;
    next();
  } catch (err) {
    console.error('Error verifying token', err);
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Endpoint for user registration
app.post('/api/signup', (req, res) => {
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

// Endpoint for user login
app.post('/api/login', (req, res) => {
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

// Endpoint for adding a new train
app.post('/api/trains/create', verifyToken, (req, res) => {
  const { train_name, source, destination, seat_capacity, arrival_time_at_source, arrival_time_at_destination } = req.body;
  if (!train_name || !source || !destination || !seat_capacity || !arrival_time_at_source || !arrival_time_at_destination) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting MySQL connection', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    connection.query('INSERT INTO trains (train_name, source, destination, seat_capacity, arrival_time_at_source, arrival_time_at_destination) VALUES (?, ?, ?, ?, ?, ?)', [train_name, source, destination, seat_capacity, arrival_time_at_source, arrival_time_at_destination], (error, results, fields) => {
      connection.release();

      if (error) {
        console.error('Error executing MySQL query', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.status(200).json({ message: 'Train added successfully', train_id: results.insertId });
    });
  });
});

// Endpoint for fetching train availability between source and destination
app.get('/api/trains/availability', (req, res) => {
  const { source, destination } = req.query;
  if (!source || !destination) {
    return res.status(400).json({ error: 'Missing source or destination parameter' });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting MySQL connection', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    connection.query('SELECT id AS train_id, train_name, seat_capacity - booked_seats AS available_seats FROM trains WHERE source = ? AND destination = ?', [source, destination], (error, results, fields) => {
      connection.release();

      if (error) {
        console.error('Error executing MySQL query', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.status(200).json(results);
    });
  });
});

// Endpoint to book a train ticket
app.post('/api/trains/:train_id/book', verifyToken, (req, res) => {
  const { user_id, no_of_seats } = req.body;
  const train_id = req.params.train_id;
  
  if (!user_id || !no_of_seats) {
    return res.status(400).json({ error: 'Missing user_id or no_of_seats in request body' });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting MySQL connection', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    connection.query('SELECT seat_capacity - booked_seats AS available_seats FROM trains WHERE id = ?', [train_id], (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query', error);
        connection.release();
        return res.status(500).json({ error: 'Internal server error' });
      }

      const available_seats = results[0].available_seats;

      if (no_of_seats > available_seats) {
        connection.release();
        return res.status(400).json({ error: 'Not enough available seats' });
      }

      const bookingIds = [];
      const seatNumbers = [];
      let insertedCount = 0; // Track the number of successful insertions
      for (let i = 0; i < no_of_seats; i++) {
        connection.query('INSERT INTO bookings (train_id, user_id, no_of_seats, seat_numbers) VALUES (?, ?, ?, ?)', [parseInt(train_id), parseInt(user_id), parseInt(no_of_seats), 1 ], (error, results, fields) => {
          if (error) {
            console.error('Error executing MySQL query', error);
            connection.release();
            return res.status(500).json({ error: 'Internal server error' });
          } else {
            insertedCount++;
            bookingIds.push(results.insertId);
            seatNumbers.push(i + 1);

            if (insertedCount === no_of_seats) {
              connection.query('UPDATE trains SET booked_seats = booked_seats + ? WHERE id = ?', [no_of_seats, train_id], (error, results, fields) => {
                if (error) {
                  console.error('Error executing MySQL query', error);
                  connection.release();
                  return res.status(500).json({ error: 'Internal server error' });
                }

                connection.commit((error) => {
                  if (error) {
                    console.error('Error committing MySQL transaction', error);
                    connection.rollback(() => {
                      connection.release();
                      return res.status(500).json({ error: 'Internal server error' });
                    });
                  }
                  connection.release();
                  res.status(200).json({ message: 'Seat(s) booked successfully', booking_ids: bookingIds, seat_numbers: seatNumbers });
                });
              });
            }
          }
        });
      }
    });
  });
});

// Endpoint for getting specific booking details
app.get('/api/bookings/:booking_id', verifyToken, async (req, res) => {
  const bookingId = req.params.booking_id;

  try {
    const [rows] = await pool.promise().query('SELECT * FROM bookings WHERE id = ?', [bookingId]);

    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ error: 'Booking not found' });
    }
  } catch (error) {
    console.error('Error retrieving booking details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
