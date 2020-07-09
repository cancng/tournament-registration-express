const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const { authMw, isAdmin } = require('../middlewares/auth');

const Tournament = require('../models/Tournaments');

router.get('/', [authMw, isAdmin], (req, res) => {
  res.json({ msg: 'tournament route' });
  console.log(req.user);
});

/**
 * @route POST /api/tournament/create
 * @desc Create a tournament
 * @access Private (only administrator)
 */
router.post(
  '/create',
  [
    authMw,
    isAdmin,
    [
      check('name', 'Turnuva adı boş bırakılamaz').not().isEmpty(),
      check('event_date', 'Turnuva tarihi boş bırakılamaz').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, event_date } = req.body;
    try {
      const newTournament = new Tournament({
        name,
        eventDate: event_date,
      });
      await newTournament.save();
      res.json(newTournament);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: 'Server error' });
    }
    // res.send('asdsad');
  }
);

/**
 * @route GET /api/tournament/list
 * @desc List all tournaments
 * @access Public
 */
router.get('/list', async (req, res) => {
  try {
    const tournament = await Tournament.find().select('-tournamentDetails');
    res.json(tournament);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ errors: 'Server error' });
  }
});

/**
 * @route POST /api/tournament/join/:tournamentId
 * @desc Register a team for tournament
 * @access Private
 */
router.put(
  '/join/:tournamentId',
  [
    authMw,
    [
      check('team_name', 'Takım adı boş bırakılamaz').not().isEmpty(),
      check('team_players', 'Oyuncular boş bırakılamaz').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { team_name, team_players } = req.body;
    const teamScheme = {
      user: req.user.id,
      teamName: team_name,
      teamPlayers: team_players.split(',').map((player) => player.trim()),
    };
    try {
      const tournament = await Tournament.findById(req.params.tournamentId);
      if (tournament.isActive === false) {
        return res.status(400).json({ msg: 'Bu turnuvanın kayıtları kapalı' });
      }
      const isRegistered = tournament.tournamentDetails.filter(
        (detail) => detail.user == req.user.id
      );
      if (isRegistered.length > 0) {
        return res.status(400).json({
          errors: 'Bu turnuvaya zaten kayıt yapmışsınız.',
          team: {
            name: isRegistered[0].teamName,
            players: isRegistered[0].teamPlayers,
          },
        });
      }
      tournament.tournamentDetails.unshift(teamScheme);
      await tournament.save();
      res.json({ msg: 'Başarıyla kayıt oldunuz' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: 'Server error' });
    }
  }
);

/**
 * @route DELETE /api/tournament/left_team/:tournamentId/:teamId
 * @desc Remove the team registration
 * @access Private
 */
router.delete('/left_team/:tournamentId/:teamId', authMw, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);

    tournament.tournamentDetails = tournament.tournamentDetails.filter(
      (team) => team._id.toString() !== req.params.teamId
    );

    await tournament.save();
    return res.status(200).json({
      msg:
        'Turnuvadan kaydınız silindi, isterseniz tekrar kayıt olabilirsiniz.',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: 'Server error' });
  }
});

module.exports = router;
