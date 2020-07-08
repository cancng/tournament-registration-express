require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const db = require('../config/db');

db();
const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: '🎉',
  });
});

app.use('/api/users', require('../routes/users'));
app.use('/api/auth', require('../routes/auth'));

module.exports = app;
