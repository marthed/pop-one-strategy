import { getRandomInt } from './functions.js';

export const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Middle'];

export const subZones = {
  A: { option1: ['B', 'D', 'Middle'] },
  B: { option1: ['A', 'D', 'Middle'], option2: ['C', 'Middle', 'E'] },
  C: { option1: ['B', 'Middle', 'E'] },
  D: { option1: ['A', 'B', 'Middle'], option2: ['F', 'Middle', 'G'] },
  E: { option1: ['B', 'Middle', 'C'], option2: ['Middle', 'G', 'H'] },
  F: { option1: ['D', 'Middle', 'G'] },
  G: { option1: ['D', 'Middle', 'F'], option2: ['Middle', 'E', 'H'] },
  H: { option1: ['Middle', 'G', 'E'] },
  Middle: {
    option1: ['A', 'B', 'D'],
    option2: ['B', 'C', 'E'],
    option3: ['D', 'F', 'G'],
    option4: ['E', 'G', 'H'],
  },
};

export const zoneWeaknesses = {
  B: { option1: ['A', 'C'] },
  D: { option1: ['A', 'F'] },
  E: { option1: ['C', 'H'] },
  G: { option1: ['F', 'H'] },
  Middle: { option1: ['B', 'G'], option2: ['D', 'E'] },
};

export const getTeamsStartPositions = (teams) => {
  const possibleStartzones = zones.filter((zone) => zone !== 'Middle');
  return teams.reduce(
    (acc, team) => {
      const { restzones, zonesWithPlayers } = acc;
      const zoneIndex = getRandomInt(restzones.length - 1);
      return {
        ...acc,
        restzones: restzones.filter((s) => s !== restzones[zoneIndex]),
        zonesWithPlayers: zonesWithPlayers.concat(restzones[zoneIndex]),
        teams: acc.teams.concat({
          id: team,
          currentZone: restzones[zoneIndex],
        }),
      };
    },
    {
      restzones: possibleStartzones,
      zonesWithPlayers: [],
      activeZones: zones,
      teams: [],
    }
  );
};

export const reduceZones = (gameObject) => {
  const { activeZones } = gameObject;

  if (activeZones.length < 5) {
    return {
      ...gameObject,
      activeZones: [activeZones[getRandomInt(activeZones.length)]],
    };
  }

  const zoneIndex = getRandomInt(activeZones.length - 1);
  const z = activeZones[zoneIndex];
  const subZoneObject = subZones[z];
  const options = Object.keys(subZoneObject);
  const index = getRandomInt(options.length - 1);
  const option = options[index];

  const additionalSubZones = subZoneObject[option];
  return { ...gameObject, activeZones: [z, ...additionalSubZones] };
};

export const getActions = (gameObject) => {
  const { teams, activeZones } = gameObject;
  const actions = teams.map((team) => {
    const isInSafeZone = activeZones.find((zone) => zone === team.currentZone);
    if (isInSafeZone) {
      const shouldDefend = activeZones.length === 1 || !!getRandomInt(1);
      if (shouldDefend) return { ...team, currentAction: 'Defend' };
      const possibleNextZones = activeZones.filter(
        (zone) => zone !== team.currentZone
      );
      const nextZone =
        possibleNextZones[getRandomInt(possibleNextZones.length)];
      return { ...team, currentAction: 'Attack', nextZone };
    } else {
      const possibleNextZones = Object.values(
        subZones[team.currentZone]
      ).reduce((acc, value) => {
        return acc
          .filter((zone) => !value.find((z) => z === zone))
          .concat(value)
          .filter((z) => activeZones.find((zone) => z === zone));
      }, []);

      const nextZone =
        possibleNextZones[getRandomInt(possibleNextZones.length)];

      return { ...team, currentAction: 'Attack', nextZone };
    }
  });
  return actions;
};

export const getTeamsPerZone = (actions) =>
  actions.reduce(
    (acc, { currentZone, currentAction, id, nextZone }) =>
      currentAction === 'Defend'
        ? { ...acc, [currentZone]: [...(acc[currentZone] || [])].concat(id) }
        : { ...acc, [nextZone]: [...(acc[nextZone] || [])].concat(id) },
    {}
  );

export const getSurvivingTeams = ({ teamsPerZone, actions }) =>
  Object.entries(teamsPerZone).reduce((acc, [zone, teams]) => {
    if (teams.length === 1) {
      return { ...acc, [zone]: teams[0] };
    }
    const teamActions = teams.map((team) => actions.find((a) => a.id === team));

    const defender = teamActions.find(
      (action) => action.currentAction === 'Defend'
    );

    const attackers = teamActions.filter(
      (action) => action.currentAction === 'Attack'
    );

    if (teams.length === 2) {
      return { ...acc, [zone]: defender?.id || teams[getRandomInt(2)] };
    }
    if (defender) {
      const weakness = zoneWeaknesses[defender.currentZone];
      if (!weakness) return { ...acc, [zone]: defender.id };
      const attackersAreSurrounding = Object.keys(weakness).find(
        ([zone1, zone2]) =>
          attackers.filter(
            (a) => a.currentZone === zone1 || a.currentZone === zone2
          ).length > 1
      );
      return attackersAreSurrounding
        ? { ...acc, [zone]: attackers[getRandomInt(attackers.length)].id }
        : { ...acc, [zone]: defender.id };
    }
    return { ...acc, [zone]: teams[getRandomInt(teams.length)] };
  }, {});
