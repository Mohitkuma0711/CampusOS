const express = require('express');
const User = require('../../../../Models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $setOnInsert: { firebaseUid: req.user.uid, email: req.user.email || '' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
