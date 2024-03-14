IRCTC API
Railway Management API is a RESTful API built with Node.js, Express, and MySQL for managing train operations including user authentication, train management, and ticket booking.

Features
User registration and authentication using JWT tokens.
Adding new trains with details such as name, source, destination, seat capacity, and arrival times.
Fetching train availability between source and destination.
Booking train tickets for users.
Installation
Clone the repository:

bash
Copy code
git clone https://github.com/mayyurs/IRCTC-API.git
Install dependencies:

bash
Copy code
cd IRCTC-API
npm install
Set up environment variables:

Create a .env file in the project root and add the following variables:

makefile
Copy code
PORT=3000
SECRET_KEY=your_secret_key_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=admin
DB_DATABASE=railway_management
Start the server:

bash
Copy code
npm start
Usage
Register a new user: POST /api/signup
Login: POST /api/login
Add a new train: POST /api/trains/create
Fetch train availability: GET /api/trains/availability?source=SOURCE&destination=DESTINATION
Book a train ticket: POST /api/trains/:train_id/book
Get Specific Booking Details : [GET] /api/bookings/:booking_id
Dependencies
Express - Web framework for Node.js
jsonwebtoken - JSON Web Token implementation
mysql2 - MySQL client for Node.js
Contributing
Contributions are welcome! Please open an issue or submit a pull request for any new features, improvements, or bug fixes.

License
This project is licensed under the MIT License - see the LICENSE file for details.
