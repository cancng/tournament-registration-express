const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const normalize = require('normalize-url');
const rcSecretKey = '6LcrQbQZAAAAACpo8mGmKbUb2cRvx8I92VJ8jhCX';
const { stringify } = require('querystring');
const fetch = require('node-fetch');

const User = require('../models/User');

const { authMw, isAdmin } = require('../middlewares/auth');
const checkObjectId = require('../middlewares/checkObjectId');
/**
 * @route POST /api/users
 * @desc Register user
 * @access Public
 */
router.post(
  '/',
  [
    check('name', 'İsim boş bırakılamaz').not().trim().isEmpty(),
    check('email', 'Geçerli bir e-posta girin').trim().isEmail(),
    check('password', 'Şifre en az 6 karakter olmalı').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, captcha } = req.body;

    if (!captcha)
      return res
        .status(400)
        .json({ errors: [{ msg: 'ReCAPTCHA doğrulayınız' }] });

    const query = stringify({
      secret: rcSecretKey,
      response: captcha,
      remoteip: req.connection.remoteAddress,
    });
    const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;

    // Make a request to verifyURL
    const body = fetch(verifyURL).then((res) => res.json());

    // If not successful
    if (body.success !== undefined && !body.success)
      return res.status(400).json({ errors: [{ msg: 'ReCAPTCHA hatası!' }] });
    // If successful
    // return res.json({ success: true, msg: 'Captcha passed', body });

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
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

/**
 * @route GET /api/users
 * @desc List all registered users
 * @access Private (only admin)
 */
router.get('/', [authMw, isAdmin], async (req, res) => {
  try {
    const users = await User.find().sort({ date: 'desc' });
    return res.json(users);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

/**
 * @route POST /api/users/setActivity/:userId
 * @desc Set user activity
 * @access Private (only admin)
 */
router.post(
  '/setActivity/:userId',
  [authMw, isAdmin, checkObjectId('userId')],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      const isAdmin = user.get('isAdmin');
      if (isAdmin === '1')
        return res
          .status(400)
          .json({ errors: [{ msg: 'Admin pasif yapılamaz!' }] });
      user.isActive = !user.isActive;
      await user.save();
      return res.json({ msg: 'success' });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

/**
 * @route DELETE /api/users/:userId
 * @desc Delete a user from system
 * @access Private (only admin)
 */
router.delete(
  '/:userId',
  [authMw, isAdmin, checkObjectId('userId')],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      const isAdmin = user.get('isAdmin');
      if (isAdmin === '1')
        return res.status(400).json({ msg: 'Admin üyenin kaydı silinemez!' });
      user.deleteOne();
      return res.json({ msg: 'Üye kaydı silindi!' });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
