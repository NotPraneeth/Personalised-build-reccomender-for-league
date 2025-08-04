const { extractRuneData } = require('./extractRuneData');

function analyzeMatchData(matchData) {
  const processedMatchups = [];

  const positions = {
    TOP: [],
    JUNGLE: [],
    MIDDLE: [],
    BOTTOM: [],
    UTILITY: [],
  };

  const participants = matchData.info.participants;

  for (const p of participants) {
    if (positions[p.teamPosition]) {
      positions[p.teamPosition].push(p);
    }
  }

  for (const lane in positions) {
    const [playerA, playerB] = positions[lane];

    if (playerA && playerB) {
      [playerA, playerB].forEach((player, index) => {
        const opponent = index === 0 ? playerB : playerA;

        const matchupRecord = {
          matchId: matchData.metadata.matchId,
          patch: matchData.info.gameVersion,
          championId: player.championId,
          championName: player.championName,
          opponentChampionId: opponent.championId,
          opponentChampionName: opponent.championName,
          lane: player.teamPosition,
          role: player.role,
          win: player.win,
          items: [
            player.item0,
            player.item1,
            player.item2,
            player.item3,
            player.item4,
            player.item5,
          ].filter(id => id !== 0),
          runes: extractRuneData(player.perks),
        };

        processedMatchups.push(matchupRecord);
      });
    }
  }

  return processedMatchups;
}

module.exports = { analyzeMatchData };
