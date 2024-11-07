const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  location: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true }, // New gender field
  online: { type: Boolean, default: false },
  isSeekingMatch: { type: Boolean, default: false },
  matchedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

module.exports = mongoose.model('User', userSchema);
