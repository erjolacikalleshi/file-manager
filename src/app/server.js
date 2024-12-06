const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const express = require('express');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const SECRET_KEY = 'a2X9zP#mK7$qL3@fR5*jN1&sT6^bH4!';

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));


server.use(middlewares);

// Custom middleware to handle login
server.post('/login', (req, res) => {
  console.log('Received body:', req.body); 

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in the database
    const user = router.db.get('users')
      .find({ email, password })
      .value();

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      }, 
      SECRET_KEY, 
      { expiresIn: '1h' }
    );

    // Send response with the access token and user info
    res.status(200).json({ 
      accessToken, 
      user: { 
        id: user.id, 
        email: user.email 
      } 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Use default router
server.use(router);

// Start the server
server.listen(3000, () => {
  console.log('JSON Server is running on http://localhost:3000');
});