const mongoose = require('mongoose');

const resumeDraftSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  resume: { type: mongoose.Schema.Types.Mixed, required: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ResumeDraft', resumeDraftSchema);
