function normalizeScope(scope) {
  const value = typeof scope === 'string' ? scope.trim().toLowerCase() : 'cohort';
  if (['cohort', 'class', 'institution'].includes(value)) {
    return value;
  }
  return 'cohort';
}

function buildLeaderboard({ scope = 'cohort', entries = [] } = {}) {
  const resolvedScope = normalizeScope(scope);
  const filtered = Array.isArray(entries)
    ? entries
        .filter((entry) => entry && typeof entry.display_name === 'string')
        .filter((entry) => entry.consent !== false)
        .map((entry, index) => ({
          rank: index + 1,
          display_name: entry.display_name,
          score: Number(entry.score ?? 0),
          consent: Boolean(entry.consent ?? true),
        }))
        .sort((left, right) => right.score - left.score || left.display_name.localeCompare(right.display_name))
        .map((entry, index) => ({ ...entry, rank: index + 1 }))
    : [];

  return {
    scope: resolvedScope,
    rows: filtered,
    total: filtered.length,
  };
}

function getLeaderboardScope({ userRole = 'learner', requestedScope = 'cohort', cohortMembership = false } = {}) {
  const resolvedScope = normalizeScope(requestedScope);

  if (userRole === 'trainer') {
    return { allowed: true, scope: resolvedScope, reason: 'Trainer access is allowed for sponsored learner rankings.' };
  }

  if (resolvedScope === 'cohort') {
    if (!cohortMembership) {
      return { allowed: false, scope: resolvedScope, reason: 'Join a cohort before viewing the cohort leaderboard.' };
    }
    return { allowed: true, scope: resolvedScope, reason: 'Learner access is limited to their joined cohort.' };
  }

  return {
    allowed: false,
    scope: resolvedScope,
    reason: 'Institutional or class leaderboard access requires trainer permission and consent-aware sharing.',
  };
}

module.exports = { buildLeaderboard, getLeaderboardScope, normalizeScope };
