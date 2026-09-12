const express = require('express');
const ResumeDraft = require('../../../../Models/ResumeDraft');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/draft', requireAuth, async (req, res, next) => {
  try {
    const draft = await ResumeDraft.findOne({ firebaseUid: req.user.uid });
    res.json({ draft });
  } catch (error) { next(error); }
});

router.put('/draft', requireAuth, async (req, res, next) => {
  try {
    const draft = await ResumeDraft.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { resume: req.body.resume, completed: Boolean(req.body.completed) },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    res.json({ draft });
  } catch (error) { next(error); }
});

module.exports = router;
