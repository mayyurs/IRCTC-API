const express = require('express');
const router = express.Router();
const pool = require('../db');

//Adding a new train
router.post('/api/trains/create', verifyToken, (req, res) => {
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

// Availability of Train
router.get('/api/trains/availability', (req, res) => {
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

  // Booking a seat
  router.post('/api/trains/:train_id/book', verifyToken, (req, res) => {
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
  
      // Begin transaction
      connection.beginTransaction((error) => {
        if (error) {
          console.error('Error beginning MySQL transaction', error);
          connection.release();
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        // Check available seats
        connection.query('SELECT seat_capacity - booked_seats AS available_seats FROM trains WHERE id = ?', [train_id], (error, results, fields) => {
          if (error) {
            console.error('Error executing MySQL query', error);
            connection.rollback(() => {
              connection.release();
              return res.status(500).json({ error: 'Internal server error' });
            });
          }
  
          const available_seats = results[0].available_seats;
  
          if (no_of_seats > available_seats) {
            connection.rollback(() => {
              connection.release();
              return res.status(400).json({ error: 'Not enough available seats' });
            });
          }
  
          // Book seats
          const bookingIds = [];
          const seatNumbers = [];
          let insertedCount = 0; // Track the number of successful insertions
          for (let i = 0; i < no_of_seats; i++) {
            connection.query('INSERT INTO bookings (train_id, user_id) VALUES (?, ?)', [train_id, user_id], (error, results, fields) => {
              if (error) {
                console.error('Error executing MySQL query', error);
                connection.rollback(() => {
                  connection.release();
                  return res.status(500).json({ error: 'Internal server error' });
                });
              } else {
                insertedCount++;
                bookingIds.push(results.insertId);
                seatNumbers.push(i + 1);
  
                // If all seats have been successfully inserted, update booked_seats and commit the transaction
                if (insertedCount === no_of_seats) {
                  connection.query('UPDATE trains SET booked_seats = booked_seats + ? WHERE id = ?', [no_of_seats, train_id], (error, results, fields) => {
                    if (error) {
                      console.error('Error executing MySQL query', error);
                      connection.rollback(() => {
                        connection.release();
                        return res.status(500).json({ error: 'Internal server error' });
                      });
                    }
  
                    // Commit transaction
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
  });

module.exports = router;
