const crypto = require('crypto');
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  course: { type: String, trim: true, maxlength: 100 }, // optional, frame A3
  joinCode: { type: String, unique: true, sparse: true }, // 6 random digits, unique per project (DD-08)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// 6 random digits (frames A4, B3). Not derivable from other codes; TMP-06 must also limit wrong guesses (#13).
const newJoinCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const isDuplicateCode = (err) => err.code === 11000 && err.keyPattern && err.keyPattern.joinCode;

// Saves the project with a fresh join code, retrying if the code is already taken.
projectSchema.methods.saveWithJoinCode = async function saveWithJoinCode() {
  for (let attempt = 0; ; attempt += 1) {
    this.joinCode = newJoinCode();
    try {
      return await this.save();
    } catch (err) {
      if (!isDuplicateCode(err) || attempt >= 4) throw err;
    }
  }
};

module.exports = mongoose.model('Project', projectSchema);
