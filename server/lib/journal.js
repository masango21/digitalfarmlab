function sanitizeJournalEntry({
  userId,
  title,
  body,
  tags = [],
  visibility = 'private',
} = {}) {
  const trimmedTitle = typeof title === 'string' ? title.trim() : '';
  const trimmedBody = typeof body === 'string' ? body.trim() : '';
  const validVisibility = ['private', 'cohort', 'institution'].includes(visibility);

  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'Journal entry requires a valid user id.' };
  }

  if (trimmedTitle.length < 2 || trimmedTitle.length > 80) {
    return { valid: false, error: 'Journal title must be between 2 and 80 characters.' };
  }

  if (trimmedBody.length < 10 || trimmedBody.length > 2000) {
    return { valid: false, error: 'Journal body must be between 10 and 2000 characters.' };
  }

  if (!validVisibility) {
    return { valid: false, error: 'Visibility must be private, cohort, or institution.' };
  }

  const cleanTags = Array.isArray(tags)
    ? [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5))]
    : [];

  return {
    valid: true,
    entry: {
      userId,
      title: trimmedTitle,
      body: trimmedBody,
      tags: cleanTags,
      visibility,
      createdAt: new Date().toISOString(),
    },
  };
}

function buildFeedbackSummary({ feedback = [] } = {}) {
  const items = Array.isArray(feedback) ? feedback : [];
  const positive = items.filter((item) => String(item?.rating || '').toLowerCase() === 'positive').length;
  const neutral = items.filter((item) => String(item?.rating || '').toLowerCase() === 'neutral').length;
  const negative = items.filter((item) => String(item?.rating || '').toLowerCase() === 'negative').length;

  return {
    total: items.length,
    positive,
    neutral,
    negative,
    pendingReview: neutral,
    status: neutral > 0 ? 'needs-attention' : 'stable',
  };
}

module.exports = {
  sanitizeJournalEntry,
  buildFeedbackSummary,
};
