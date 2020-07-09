const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const { authMw } = require('../middlewares/auth');

const User = require('../models/User');
const Tournament = require('../models/Tournaments');

/**
 * @route GET api/profile/me
 * @desc Get current logged user profile
 * @access Private
 */
// router.get('/me')

module.exports = router;
