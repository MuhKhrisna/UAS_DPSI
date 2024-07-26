const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./firebase');
dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/orders', require('./routes/orders'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
