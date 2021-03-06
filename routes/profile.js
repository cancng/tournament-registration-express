const router = require('express').Router();
const { authMw } = require('../middlewares/auth');

const Tournament = require('../models/Tournaments');

/**
 * @route GET api/profile/me
 * @desc Get current logged user profile
 * @access Private
 */
router.get('/registrations', authMw, async (req, res) => {
  try {
    const tournament = await Tournament.find().select('tournamentDetails');
    let data = [];
    tournament.forEach((trnmt) => {
      const temporaryArray = trnmt.tournamentDetails
        .filter((team) => team.user.toString() === req.user.id)
        .map((team) => {
          return {
            user: team.user,
            teamName: team.teamName,
            tournamentId: trnmt._id,
            teamId: team._id,
          };
        });
      data.push(...temporaryArray);
    });
    return res.json(data);
  } catch (err) {
    console.error(err.message);
    return res.json({ errors: [{ msg: 'Server error' }] });
  }
});

module.exports = router;
