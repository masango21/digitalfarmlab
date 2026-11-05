const DEFAULT_REWARDS = [
  {
    id: 'farm-profile',
    title: 'Farm profile',
    description: 'Create and save your first farm profile.',
    points: 40,
    verified: false,
  },
  {
    id: 'field-setup',
    title: 'Field setup',
    description: 'Add a field and confirm its baseline details.',
    points: 60,
    verified: false,
  },
  {
    id: 'scenario-run',
    title: 'Scenario run',
    description: 'Complete a scenario run to measure a farm plan.',
    points: 40,
    verified: false,
  },
];

function buildGamificationState({ farmCount = 0, fieldCount = 0, scenarioRuns = 0, earnedRewardIds = [] } = {}) {
  const rewardCatalog = DEFAULT_REWARDS.map((reward) => {
    const verified =
      (reward.id === 'farm-profile' && Number(farmCount) >= 1) ||
      (reward.id === 'field-setup' && Number(fieldCount) >= 1) ||
      (reward.id === 'scenario-run' && Number(scenarioRuns) >= 1);

    return {
      ...reward,
      verified,
      earned: verified || (Array.isArray(earnedRewardIds) && earnedRewardIds.includes(reward.id)),
    };
  });

  const achievements = rewardCatalog.filter((reward) => reward.verified || reward.earned);
  const totalPoints = achievements.reduce((total, reward) => total + Number(reward.points || 0), 0);
  const level = 1 + Math.floor(totalPoints / 100);

  return {
    level,
    totalPoints,
    nextLevelAt: level * 100,
    achievements: achievements.map((reward) => ({
      id: reward.id,
      title: reward.title,
      description: reward.description,
      points: Number(reward.points || 0),
      verified: Boolean(reward.verified),
      earned: Boolean(reward.earned),
    })),
  };
}

function awardRewards({ rewards = DEFAULT_REWARDS, earnedRewardIds = [] } = {}) {
  const ids = new Set();
  const validIds = Array.isArray(earnedRewardIds) ? earnedRewardIds.filter((id) => Boolean(id)) : [];

  return rewards
    .filter((reward) => reward && reward.id && !ids.has(reward.id) && ids.add(reward.id))
    .map((reward) => ({
      id: reward.id,
      title: reward.title,
      description: reward.description,
      points: Number(reward.points || 0),
      verified: Boolean(reward.verified),
      earned: Boolean(reward.verified) || validIds.includes(reward.id),
    }));
}

module.exports = {
  DEFAULT_REWARDS,
  buildGamificationState,
  awardRewards,
};
