# IRCTC API

IRCTC API is a RESTful API built with Node.js, Express, and MySQL for managing train operations including user authentication, train management, and ticket booking.

## Features

- User registration and authentication using JWT tokens.
- Adding new trains with details such as name, source, destination, seat capacity, and arrival times.
- Fetching train availability between source and destination.
- Booking train tickets for users.
- Get Specific Booking Details.

## Usage
~ node app.js
~ use API client (thunderclient/POSTMAN API)

Register a new user: POST /api/signup

![registration](https://github.com/mayyurs/IRCTC-API/assets/110163825/83336b45-8c64-4821-afbd-b1ed82a6bb9f)

Login: POST /api/login

![login](https://github.com/mayyurs/IRCTC-API/assets/110163825/90f40415-841e-4a0e-99be-7c06c2691514)

Add a new train: POST /api/trains/create

![add_train](https://github.com/mayyurs/IRCTC-API/assets/110163825/a4835180-3e1d-4728-b8c5-81c12098faec)

Fetch train availability: GET /api/trains/availability?source=SOURCE&destination=DESTINATION

![seat_availability](https://github.com/mayyurs/IRCTC-API/assets/110163825/503b1d57-3d3c-4f1b-a4da-af6d6b7a02ee)

Book a train ticket: POST /api/trains/:train_id/book

![seat_booked](https://github.com/mayyurs/IRCTC-API/assets/110163825/2e1c1c4a-7843-471c-b432-a1dfbeb5b8db)

Get Specific Booking Details: GET /api/bookings/:booking_id

![booking_details](https://github.com/mayyurs/IRCTC-API/assets/110163825/3e9b0059-fbda-41f9-bb3a-ab2caaef4a17)

Dependencies
Express - Web framework for Node.js
jsonwebtoken - JSON Web Token implementation
mysql2 - MySQL client for Node.js
