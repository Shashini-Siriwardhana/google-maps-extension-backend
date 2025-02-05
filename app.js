const express = require('express');
const routes = require('./routes/routes');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(
    cors({
        origin: 'http://localhost:5173', 
        credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    })
);

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/', routes);

module.exports = app;