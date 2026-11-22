const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const attempts = require('./attempts');
const { TOO_MANY, projectForCode, addMember, alreadyOn, joinedProject } = require('./join');

const TOKEN_TTL = '8h';
const INVALID = 'Email or password is incorrect.';
// Compared against when the email is unknown, so both failures take the same time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

// Rejects any request without a valid, unexpired JWT (RC-01). Sets req.userId.
function requireAuth(jwtSecret) {
  return (req, res, next) => {
    const [scheme, token] = (req.get('Authorization') || '').split(' ');
    try {
      if (scheme !== 'Bearer' || !token) throw new Error();
      req.userId = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }).sub;
      next();
    } catch {
      res.status(401).json({ error: 'Sign in required.' });
    }
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8; // for every D7 join (#14 decision)
const isPassword = (p) => typeof p === 'string' && p.length > 0 && Buffer.byteLength(p) <= 72; // bcrypt's input limit

// POST /api/auth/signin, and POST /api/auth/join (join a project by code, frame D7).
// There is deliberately no sign-up route: an account is only created by joining with a valid code (RC-01).
function authRouter(jwtSecret) {
  const router = express.Router();
  const session = (user) => ({
    token: jwt.sign({ sub: user.id }, jwtSecret, { algorithm: 'HS256', expiresIn: TOKEN_TTL }),
    user: { id: user.id, name: user.name, email: user.email },
  });

  router.post('/signin', async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
      const user = await User.findOne({ email: email.trim().toLowerCase() });
      const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
      if (!user || !ok) return res.status(401).json({ error: INVALID });

      res.json(session(user));
    } catch (err) {
      next(err);
    }
  });

  // Signed-out join (US-15): a new email gets an account; an existing one must give its own password.
  router.post('/join', async (req, res, next) => {
    try {
      const { name, email, password } = req.body || {};
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
        return res.status(400).json({ error: 'Enter your full name.' });
      }
      if (typeof email !== 'string' || !EMAIL.test(email.trim())) {
        return res.status(400).json({ error: 'Enter a valid email.' });
      }
      // Checked before any lookup for every D7 join, so the response can't reveal whether an email has an account.
      if (!isPassword(password) || password.length < MIN_PASSWORD) {
        return res.status(400).json({ error: `Enter a password of at least ${MIN_PASSWORD} characters.` });
      }

      const keys = [`ip:${req.ip}`];
      const project = await projectForCode(req, res, keys);
      if (!project) return;

      let user = await User.findOne({ email: email.trim().toLowerCase() });
      let created = false;
      if (user) {
        // Never add someone's account to a project without their password. A wrong one stays counted.
        if (!attempts.begin(keys)) return res.status(429).json({ error: TOO_MANY });
        if (!(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: INVALID });
        attempts.refund(keys);
      } else {
        user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
        created = true;
      }

      let added;
      try {
        added = await addMember(user._id, project._id);
      } catch (err) {
        if (created) await User.deleteOne({ _id: user._id }); // no account without the project it was made for
        throw err;
      }
      if (!added) return res.status(409).json({ error: `${alreadyOn(project)} Sign in instead.` });
      res.status(201).json({ ...session(user), project: joinedProject(project) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { requireAuth, authRouter };
