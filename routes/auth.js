const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMw } = require('../middlewares/auth');
const User = require('../models/User');
const rcSecretKey = '6LcrQbQZAAAAACpo8mGmKbUb2cRvx8I92VJ8jhCX';
const { stringify } = require('querystring');
const fetch = require('node-fetch');

/**
 * @route GET /api/auth
 * @desc test route
 * @access Private
 */
router.get('/', authMw, async (req, res) => {
  // i am storing a user id in "req.user". i've done it inside of auth.js middleware
  // console.log(req.user);
  try {
    const user = await User.findById(req.user.id).select('-password'); // find the user matched the jwt-> req.user.id and remove password
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
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
    check('password', 'Şifre gerekli').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, captcha } = req.body;

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
      if (!user.isActive) {
        return res.status(400).json({
          errors: [
            {
              msg:
                'Üyeliğiniz pasif duruma getirilmiş, yöneticiyle iletişime geçebilirsiniz',
            },
          ],
        });
      }

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
 * @route POST /api/auth/changepassword
 * @desc Change the user password
 * @access Private
 */
router.post(
  '/changepassword',
  [
    authMw,
    [
      check('password', 'Eski şifre en az 6 karakter olmalıdır').isLength({
        min: 6,
      }),
      check('new_password', 'Yeni şifre en az 6 karakter olmalıdır').isLength({
        min: 6,
      }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { password, new_password } = req.body;
    try {
      let user = await User.findById(req.user.id);

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(400).json({ errors: [{ msg: 'Eski şifre yanlış' }] });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(new_password, salt);
      await user.save();
      return res.json({ msg: 'Şifre değişikliği tamamlandı' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

module.exports = router;
