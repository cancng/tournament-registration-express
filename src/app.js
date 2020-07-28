require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const db = require('../config/db');

db();
const app = express();
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://turnuva.lolyama.com',
      'http://turnuva.lolyama.com',
    ],
  })
);
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
app.use('/api/tournament', require('../routes/tournament'));
app.use('/api/profile', require('../routes/profile'));

module.exports = app;
