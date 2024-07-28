const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const db = require('../firebase');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware for authentication
const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'Token is required' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token is required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRef = db.collection('users').doc(decoded.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(401).json({ message: 'Invalid token: User not found' });
    }

    req.user = userDoc.data(); // Attach user data to request object
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};


// UC-01: Memesan Kopi
router.post('/orders/order', authenticate, async (req, res) => {
  const { cafe, coffeeType, size, additions } = req.body;
  
  try {
    const orderRef = await db.collection('orders').add({
      email: req.user.email, // Use the user email from req.user
      cafe,
      coffeeType,
      size,
      additions,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json({ message: 'Order placed successfully', orderId: orderRef.id });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// UC-02: Membayar Pesanan Kopi
router.post('/pay/:orderId', authenticate, async (req, res) => {
  const { orderId } = req.params;
  const { paymentInfo } = req.body;

  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    return res.status(404).json({ message: 'Order not found' });
  }

  await orderRef.update({
    paymentInfo,
    status: 'paid',
    paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.status(200).json({ message: 'Payment successful' });
});

// UC-03: Melacak Pesanan Kopi
router.get('/track/:orderId', authenticate, async (req, res) => {
  const { orderId } = req.params;

  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.status(200).json({ order: orderDoc.data() });
});

module.exports = router;
