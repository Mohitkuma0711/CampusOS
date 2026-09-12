const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  displayName: { type: String, trim: true },
  role: { type: String, enum: ['student', 'mentor', 'employer'], default: 'student' },
  skills: [{ type: String, trim: true }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
