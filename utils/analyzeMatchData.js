const { extractRuneData } = require('./extractRuneData');


function analyzeMatchData(matchData, matchTimeline) {
  const processedMatchups = [];

  const timelineDataMap = {};
  matchData.info.participants.forEach(p => {
    timelineDataMap[p.participantId] = {
      skillOrder: "",
      startingItems: []
    };
  });

  if (matchTimeline && matchTimeline.info && matchTimeline.info.frames) {
    for (const frame of matchTimeline.info.frames) {
      for (const event of frame.events) {
        const playerTimelineData = timelineDataMap[event.participantId];
        if (!playerTimelineData) continue; 

        if (event.type === 'SKILL_LEVEL_UP' && event.levelUpType === 'NORMAL' && playerTimelineData.skillOrder.length < 18) {
          const skill = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R' }[event.skillSlot];
          if (skill) {
            playerTimelineData.skillOrder += skill;
          }
        }

        if (event.type === 'ITEM_PURCHASED' && event.timestamp <= 90000) {
          playerTimelineData.startingItems.push(event.itemId);
        }
      }
    }
  }


  const positions = {
    TOP: [], JUNGLE: [], MIDDLE: [], BOTTOM: [], UTILITY: [],
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

        const playerTimelineInfo = timelineDataMap[player.participantId];

        const matchupRecord = {
          matchId: matchData.metadata.matchId,
          patch: matchData.info.gameVersion.split('.').slice(0, 2).join('.'),
          championId: player.championId,
          championName: player.championName,
          opponentChampionId: opponent.championId,
          opponentChampionName: opponent.championName,
          lane: player.teamPosition,
          win: player.win,

          items: [
            player.item0, player.item1, player.item2,
            player.item3, player.item4, player.item5,
          ].filter(id => id !== 0),

          runes: extractRuneData(player.perks),
          
          summonerSpells: [player.summoner1Id, player.summoner2Id],
          skillOrder: playerTimelineInfo.skillOrder,
          startingItems: [...new Set(playerTimelineInfo.startingItems)],
        };

        processedMatchups.push(matchupRecord);
      });
    }
  }

  return processedMatchups;
}

module.exports = { analyzeMatchData };