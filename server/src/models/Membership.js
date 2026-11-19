const mongoose = require('mongoose');

// Exactly two per-project roles; there is no global/admin role (DD-05).
const ROLES = ['lead', 'member'];

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  role: { type: String, enum: ROLES, required: true },
});

// A user can join a project only once.
membershipSchema.index({ userId: 1, projectId: 1 }, { unique: true });

// Lists the user's projects with the role held on each (US-14).
membershipSchema.statics.listUserProjects = async function listUserProjects(userId) {
  const memberships = await this.find({ userId }).populate('projectId', 'name createdBy').lean();
  return memberships
    .filter((m) => m.projectId)
    .map((m) => ({ project: m.projectId, role: m.role }));
};

const Membership = mongoose.model('Membership', membershipSchema);

module.exports = Membership;
module.exports.ROLES = ROLES;
