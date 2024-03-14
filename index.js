const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const trainRoutes = require('./routes/trains');

app.use('/api/signup', signupRoute);
app.use('/api/login', loginRoute);
app.use('/api/trains', trainRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
