import {
  getTeamsStartPositions,
  reduceZones,
  getActions,
  getTeamsPerZone,
  getSurvivingTeams,
} from './helpers.js';
import { pipe } from './functions.js';

const teams = ['team1', 'team2', 'team3', 'team4', 'team5', 'team6'];

const init = () => {
  console.log('New Population One Game!');
  console.log('Teams: ', teams.length);
  const gameObject = getTeamsStartPositions(teams);
  gameObject.teams.forEach((team) => {
    console.log(`${team.id} goes to zone ${team.currentZone}`);
  });
  return gameObject;
};

const nextRound = (gameObject) => {
  console.log(`\nZones reduced to: ${gameObject.activeZones.join(', ')}`);

  const actions = getActions(gameObject);

  const teamsPerZone = getTeamsPerZone(actions);

  Object.entries(teamsPerZone).forEach(([zone, teams]) => {
    console.log(`\nZone: ${zone}`);
    const actionTypes = teams.reduce(
      (acc, team) =>
        actions.find((action) => action.id === team).currentAction === 'Attack'
          ? { ...acc, attack: acc.attack.concat(team) }
          : { ...acc, defend: acc.defend.concat(team) },
      { attack: [], defend: [] }
    );
    actionTypes.defend.forEach((team) => {
      console.log(`${team} is defending`);
    });

    actionTypes.attack.forEach((team) => {
      console.log(`${team} is attacking`);
    });
  });

  const survivingTeams = getSurvivingTeams({ teamsPerZone, actions });
  return {
    activeZones: Object.keys(survivingTeams),
    teams: Object.entries(survivingTeams).map(([key, value]) => ({
      id: value,
      currentZone: key,
    })),
  };
};

const checkWinner = (gameObject) => {
  if (gameObject.teams.length !== 1) {
    throw new Error('Not 1 winner!');
  }
  const winner = gameObject.teams[0];
  console.log(`\nWinning team is: ${winner.id} in zone: ${winner.currentZone}`);
};

const simulateGame = pipe(
  init,
  reduceZones,
  nextRound,
  reduceZones,
  nextRound,
  checkWinner
);

simulateGame();
process.exit(0);
