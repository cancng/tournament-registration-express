const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMw } = require('../middlewares/auth');
const User = require('../models/User');

/**
 * @route GET /api/auth
 * @desc test route
 * @access Public
 */
router.get('/', authMw, async (req, res) => {
  // i am storing a user id in "req.user". i've done it inside of auth.js middleware
  // console.log(req.user);
  try {
    const user = await User.findById(req.user.id).select('-password'); // find the user matched the jwt-> req.user.id and remove password
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

/**
 * @route POST /api/auth
 * @desc Authenticate User & get token
 * @access Public
 */

router.post(
  '/',
  [
    check('email', 'Geçerli bir e-posta girin').isEmail(),
    check('password', 'Şifre en az 6 karakter olmalı').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Bilgileriniz yanlış' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Bilgileriniz yanlış' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        // TODO: change to '1 days' when production time
        { expiresIn: '1 days' },
        (err, encodedToken) => {
          if (err) throw err;
          res.json({ token: encodedToken });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
