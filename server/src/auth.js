const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

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

// POST /api/auth/signin. There is deliberately no sign-up route (RC-01).
function authRouter(jwtSecret) {
  const router = express.Router();

  router.post('/signin', async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
      const user = await User.findOne({ email: email.trim().toLowerCase() });
      const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
      if (!user || !ok) return res.status(401).json({ error: INVALID });

      const token = jwt.sign({ sub: user.id }, jwtSecret, { algorithm: 'HS256', expiresIn: TOKEN_TTL });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { requireAuth, authRouter };
