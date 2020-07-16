const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const normalize = require('normalize-url');

const User = require('../models/User');

/**
 * @route POST /api/users
 * @desc Register user
 * @access Public
 */

router.post(
  '/',
  [
    check('name', 'İsim boş bırakılamaz').not().isEmpty(),
    check('email', 'Geçerli bir e-posta girin').isEmail(),
    check('password', 'Şifre en az 6 karakter olmalı').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Bu e-posta adresi kullanılıyor' }] });
      }
      const avatar = normalize(
        gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm',
        }),
        { forceHttps: true }
      );

      user = new User({ name, email, password, avatar });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1 days' },
        (err, encodedToken) => {
          if (err) throw err;
          res.json({ token: encodedToken });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: 'Server error' });
    }
  }
);

module.exports = router;
