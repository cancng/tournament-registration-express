const deneme = [
  {
    teamPlayers: ['pte', 'saf', 'ggnxcv', 'dsfqwer'],
    _id: '5f14698622407e159beeda51',
    user: '5f083922d9bf2f02a59f791a',
    teamName: 'İpek Team',
  },
  {
    teamPlayers: ['asd', 'qwe', 'qw', 'ea', 'dadf'],
    _id: '5f14697022407e159beeda50',
    user: '5f0c89662bddd01c941df329',
    teamName: 'Dede Team',
  },
  {
    teamPlayers: ['qt', 'asfg', 'zasd', 'uyıfgh', 'vsadn'],
    _id: '5465465498451321656546544',
    user: 'r98qw4e984qwe94qwe94e94',
    teamName: 'Keko Team',
  },
  {
    teamPlayers: ['qtasg', 'yjtı', 'cxnhre', 'rturet', 'htkşmh'],
    _id: '159498465safgh5e74t98we54649',
    user: '5reg51er61f6asf56d65wdqwet41',
    teamName: 'apdoq Team',
  },
];

const deleteTeam = (teams, teamId, userId) => {
  teams.forEach((team, index) => {
    if (team.user === userId) {
      // console.log(team);
      if (team._id === teamId) {
        teams.splice(index, 1);
      }
    }
  });
  console.log(teams);
};

deleteTeam(deneme, '5465465498451321656546544', 'r98qw4e984qwe94qwe94e94');
