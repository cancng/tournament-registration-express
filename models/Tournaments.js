const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  tournamentDetails: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      teamName: {
        type: String,
        required: true,
      },
      teamPlayers: {
        type: [String],
        required: true,
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('tournaments', TournamentSchema);
