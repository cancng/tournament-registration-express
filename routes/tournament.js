const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const { authMw, isAdmin } = require('../middlewares/auth');
const checkObjectId = require('../middlewares/checkObjectId');
const { playerRegistrar } = require('../utils');

const Tournament = require('../models/Tournaments');

/* router.get('/', [authMw, isAdmin], (req, res) => {
  res.json({ msg: 'tournament route' });
  console.log(req.user);
}); */

/**
 * @route POST /api/tournament/create
 * @desc Create a tournament
 * @access Private (only admin)
 */
router.post(
  '/create',
  [
    authMw,
    isAdmin,
    [
      check('name', 'Turnuva adı boş bırakılamaz').not().trim().isEmpty(),
      check('event_date', 'Turnuva tarihi boş bırakılamaz').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, event_date, isActive } = req.body;
    let today = new Date();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (mm < 10) {
      mm = '0' + mm;
    }
    if (dd < 10) {
      dd = '0' + dd;
    }
    let formatted = `${today.getFullYear()}-${mm}-${dd}`;
    if (event_date <= formatted) {
      return res.status(400).json({
        errors: [{ msg: 'Tarih şuandan geride olamaz.' }],
      });
    }
    try {
      const newTournament = new Tournament({
        name,
        eventDate: event_date,
        isActive,
      });
      await newTournament.save();
      res.json(newTournament);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

/**
 * @route GET /api/tournament/list
 * @desc List all tournaments
 * @access Public
 */
router.get('/list', async (req, res) => {
  try {
    const tournament = await Tournament.find().sort({ eventDate: 'desc' });
    let data = tournament.map((trnmt) => {
      return {
        _id: trnmt._id,
        name: trnmt.name,
        eventDate: trnmt.eventDate,
        teams: trnmt.tournamentDetails.map((item) => {
          return {
            captain: item.user,
            name: item.teamName,
          };
        }),
        isActive: trnmt.isActive,
      };
    });
    // console.log(tournament);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

/**
 * @route GET /api/tournament/:tournamentId
 * @desc Get a tournament
 * @access Private
 */
router.get(
  '/:tournamentId',
  [authMw, checkObjectId('tournamentId')],
  async (req, res) => {
    try {
      const tournament = await Tournament.findById(req.params.tournamentId);
      let data = {
        _id: tournament._id,
        name: tournament.name,
        eventDate: tournament.eventDate,
        teams: tournament.tournamentDetails.map((item) => {
          return {
            teamId: item._id,
            captain: item.user,
            name: item.teamName,
            players: item.teamPlayers,
          };
        }),
        isActive: tournament.isActive,
      };
      // console.log(tournament);
      res.json(data);
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

/**
 * @route DELETE /api/tournament/:tournamentId
 * @desc Delete a tournament
 * @access Private (only admin)
 */
router.delete(
  '/:tournamentId',
  [authMw, isAdmin, checkObjectId('tournamentId')],
  async (req, res) => {
    try {
      /* const tournament = await Tournament.findById(req.params.tournamentId);
      tournament.deleteOne(); */
      const result = await Tournament.findByIdAndDelete(
        req.params.tournamentId
      );
      if (!result) {
        return res.status(400).json({ errors: [{ msg: 'Turnuva ID yok' }] });
      }
      return res.json({ msg: 'Turnuva silindi' });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

/**
 * @route POST /api/tournament/setActivity/:tournamentId
 * @desc Set tournament activity
 * @access Private (only admin)
 */
router.post(
  '/setActivity/:tournamentId',
  [authMw, isAdmin, checkObjectId('tournamentId')],
  async (req, res) => {
    try {
      const tournament = await Tournament.findById(req.params.tournamentId);
      tournament.isActive = !tournament.isActive;
      await tournament.save();
      return res.json({ msg: 'success' });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

/**
 * @route POST /api/tournament/join/:tournamentId
 * @desc Register a team for tournament
 * @access Private
 */
router.post(
  '/join/:tournamentId',
  [
    authMw,
    checkObjectId('tournamentId'),
    [
      check('team_name', 'Takım adı boş bırakılamaz').not().trim().isEmpty(),
      check('team_players', 'Oyuncular boş bırakılamaz').not().trim().isEmpty(),
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
      teamPlayers: playerRegistrar(team_players),
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
          errors: [{ msg: 'Bu turnuvaya zaten kayıt yapmışsınız.' }],
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
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

/**
 * @route DELETE /api/tournament/left_team/:tournamentId/:teamId
 * @desc Remove the team registration
 * @access Private
 */
router.delete(
  '/left_team/:tournamentId/:teamId',
  [authMw, checkObjectId('tournamentId')],
  async (req, res) => {
    try {
      const tournament = await Tournament.findById(req.params.tournamentId);

      /* tournament.tournamentDetails = tournament.tournamentDetails.filter(
        (team) => team._id.toString() !== req.params.teamId
      ); */
      tournament.tournamentDetails.forEach((team, index) => {
        if (team.user.toString() === req.user.id) {
          if (team._id.toString() === req.params.teamId) {
            tournament.tournamentDetails.splice(index, 1);
          }
        }
      });

      await tournament.save();
      return res.status(200).json({
        msg:
          'Turnuvadan kaydınız silindi, isterseniz tekrar kayıt olabilirsiniz.',
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

/**
 * @route DELETE /api/tournament/kick_team/:tournamentId/:teamId
 * @desc Kick a team from tournament
 * @access Private (only admin)
 */
router.delete(
  '/kick_team/:tournamentId/:teamId',
  [authMw, isAdmin, checkObjectId('teamId'), checkObjectId('tournamentId')],
  async (req, res) => {
    try {
      const tournament = await Tournament.findById(req.params.tournamentId);
      const teams = tournament.get('tournamentDetails');
      tournament.tournamentDetails = teams.filter(
        (team) => team._id.toString() !== req.params.teamId
      );
      await tournament.save();
      return res
        .status(200)
        .json({ ...tournament._doc, teams: tournament.tournamentDetails });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

module.exports = router;
