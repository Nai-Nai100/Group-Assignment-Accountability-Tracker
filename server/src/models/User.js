const mongoose = require('mongoose');

// No role field: roles live on Membership (DD-05). Only a bcrypt hash is stored, never a plaintext password (RC-01).
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, match: BCRYPT_HASH },
});

module.exports = mongoose.model('User', userSchema);
