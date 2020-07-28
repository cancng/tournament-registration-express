const playerRegistrar = (playersString) => {
  let splittedPlayers = playersString.split(',', 10);
  return splittedPlayers
    .filter((player) => player.length > 1)
    .map((player) => player.trim());
};

module.exports = { playerRegistrar };
