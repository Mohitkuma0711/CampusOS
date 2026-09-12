const { firebaseAuth } = require('../config/firebase');

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!firebaseAuth) {
    return res.status(503).json({ error: 'Firebase Auth is not configured' });
  }
  if (!token) {
    return res.status(401).json({ error: 'Bearer token required' });
  }

  try {
    req.user = await firebaseAuth.verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
