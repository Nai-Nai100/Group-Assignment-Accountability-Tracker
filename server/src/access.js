const mongoose = require('mongoose');
const Membership = require('./models/Membership');

/*
 * Project access control (RC-02, RC-03, DD-05). Every project-scoped route uses this chain:
 *
 *   router.get('/api/projects/:projectId/things', requireAuth(secret), requireMember, handler);
 *   router.post('/api/projects/:projectId/things', requireAuth(secret), requireMember, requireLead, handler);
 *
 * After requireMember runs:
 *   req.projectId - the project id taken from the caller's Membership. Filter every query by it.
 *   req.role      - the caller's role on this project ('lead' or 'member'). There is no global role.
 */

// The caller must be a member of :projectId. Non-members get 404 so the response doesn't reveal that the project exists.
async function requireMember(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'Sign in required.' });
  const { projectId } = req.params;
  try {
    const membership = mongoose.isValidObjectId(projectId)
      ? await Membership.findOne({ userId: req.userId, projectId }).lean()
      : null;
    if (!membership) return res.status(404).json({ error: 'Not found.' });
    req.projectId = membership.projectId;
    req.role = membership.role;
    next();
  } catch (err) {
    next(err);
  }
}

// The caller must be the team lead of this project. Use after requireMember.
function requireLead(req, res, next) {
  if (req.role !== 'lead') return res.status(403).json({ error: 'Only the team lead can do this.' });
  next();
}

module.exports = { requireMember, requireLead };
