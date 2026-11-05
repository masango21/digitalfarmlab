function buildDailyChallenge({
  title = 'Daily challenge',
  target = 3,
  progress = 0,
  streak = 0,
  rewardId = 'daily-challenge',
  claimedRewardIds = [],
} = {}) {
  const safeTarget = Math.max(1, Number(target) || 1);
  const safeProgress = Math.max(0, Number(progress) || 0);
  const completed = safeProgress >= safeTarget;
  const rewarded = completed && Array.isArray(claimedRewardIds) && claimedRewardIds.includes(rewardId);

  return {
    id: rewardId,
    title,
    rewardId,
    target: safeTarget,
    progress: safeProgress,
    streak: Math.max(0, Number(streak) || 0),
    completed,
    rewarded,
    percentComplete: Math.min(100, Math.round((safeProgress / safeTarget) * 100)),
    nextReward: completed ? 'Claim complete' : `${safeTarget - safeProgress} steps left`,
  };
}

function claimChallengeReward({ challengeId, rewardId, claimedRewardIds = [] } = {}) {
  const uniqueIds = Array.isArray(claimedRewardIds)
    ? claimedRewardIds.filter(Boolean).reduce((accumulator, currentId) => {
        if (!accumulator.includes(currentId)) {
          accumulator.push(currentId);
        }
        return accumulator;
      }, [])
    : [];

  const challengeKey = rewardId || challengeId;
  const alreadyClaimed = uniqueIds.includes(challengeKey);

  if (alreadyClaimed) {
    return {
      rewardClaimed: false,
      challengeId: challengeKey,
      claimedRewardIds: uniqueIds,
      reason: 'Reward already claimed',
    };
  }

  const nextIds = [...uniqueIds, challengeKey];
  return {
    rewardClaimed: true,
    challengeId: challengeKey,
    claimedRewardIds: nextIds,
    reason: 'Reward granted',
  };
}

module.exports = {
  buildDailyChallenge,
  claimChallengeReward,
};
