const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  course: { type: String, trim: true, maxlength: 100 }, // optional, frame A3
  joinCode: { type: String, unique: true, sparse: true }, // 6 random digits, unique per project (DD-08)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Project', projectSchema);
