const crypto = require('crypto');

// Generate a random string of 32 bytes
const secretKey = crypto.randomBytes(32).toString('hex');

console.log('JWT Secret Key:', secretKey);
