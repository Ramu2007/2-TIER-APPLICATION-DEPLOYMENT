const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.APP_PORT || 80;

// Middleware for parsing form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database connection configuration (Tier 2 - Private EC2)
const dbConfig = {
    host: process.env.DB_HOST || '10.0.2.15',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'appuser',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    database: process.env.DB_NAME || 'two_tier_app',
    connectTimeout: 5000
};

// Create a connection pool to handle reconnections gracefully
const pool = mysql.createPool(dbConfig);

// Helper function to render HTML with optional message
function renderTemplate(templateName, message = '', isError = false) {
    const filePath = path.join(__dirname, 'views', templateName);
    let html = fs.readFileSync(filePath, 'utf8');
    let messageHtml = '';
    if (message) {
        const messageClass = isError ? 'message error' : 'message success';
        messageHtml = `<p class="${messageClass}">${message}</p>`;
    }
    return html.replace('{{MESSAGE_PLACEHOLDER}}', messageHtml);
}

// Routes

// 1. Root & Register Page (GET)
app.get('/', (req, res) => {
    res.send(renderTemplate('register.html'));
});

app.get('/register', (req, res) => {
    res.send(renderTemplate('register.html'));
});

// 2. Handle User Registration (POST)
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(renderTemplate('register.html', 'Please provide both username and password.', true));
    }

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    pool.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.send(renderTemplate('register.html', 'Username already exists.', true));
            }
            return res.send(renderTemplate('register.html', 'Database connection error: ' + err.message, true));
        }

        // Successfully inserted into database on Private EC2
        res.send(renderTemplate('register.html', 'Registration successful!'));
    });
});

// 3. Login Page (GET & POST)
app.get('/login', (req, res) => {
    res.send(renderTemplate('login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(renderTemplate('login.html', 'Please provide both username and password.', true));
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    pool.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.send(renderTemplate('login.html', 'Database error: ' + err.message, true));
        }

        if (results.length > 0) {
            res.send(renderTemplate('login.html', 'Login successful! Welcome, ' + username));
        } else {
            res.send(renderTemplate('login.html', 'Invalid username or password.', true));
        }
    });
});

// 4. Health check endpoint
app.get('/health', (req, res) => {
    pool.query('SELECT 1', (err) => {
        if (err) {
            return res.status(500).json({ status: 'unhealthy', db: 'disconnected', error: err.message });
        }
        res.json({ status: 'healthy', db: 'connected', tier1: 'online', tier2: 'online' });
    });
});

// Start the web server
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 2-Tier Web Application is running!`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🗄️ Database Target: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`=========================================`);
});
