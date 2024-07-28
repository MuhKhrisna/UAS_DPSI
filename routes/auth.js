const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const db = require('../firebase');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const userRef = db.collection('users').doc(email);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  await userRef.set({ email, password: hashedPassword });
  res.status(201).json({ message: 'User registered successfully' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userRef = db.collection('users').doc(email);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, userDoc.data().password);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Include user ID in the token
  const token = jwt.sign({ id: userDoc.id }, JWT_SECRET, { expiresIn: '20h' });
  res.status(200).json({ token });
});



module.exports = router;
