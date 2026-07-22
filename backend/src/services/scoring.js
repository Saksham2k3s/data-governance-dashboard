// trust score - basically how much can we trust this dataset
// quality matters most, but also check if columns are actually classified
export function calculateTrustScore({ qualityScore, columnStats }) {
  const totalColumns = columnStats.length;
  if (totalColumns === 0) return 0;

  // count columns that got some tag (not "none") or user manually checked it
  const classifiedCount = columnStats.filter(
    (c) => c.sensitivityTag !== "none" || c.isManualOverride
  ).length;
  const classificationCompleteness = (classifiedCount / totalColumns) * 100;

  // 70% quality, 30% classification - felt like a reasonable split
  const trustScore = qualityScore * 0.7 + classificationCompleteness * 0.3;

  return Math.round(trustScore * 100) / 100;
}

// value score - how much is this dataset actually getting used
export function calculateValueScore({ viewCount, lastViewedAt }) {
  if (viewCount === 0) return 0;

  // cap this so one dataset getting spammed with views doesn't break the scale
  const viewScore = Math.min(viewCount * 5, 70);

  // bonus points if it's been viewed recently, decays the older it gets
  let recencyScore = 0;
  if (lastViewedAt) {
    const daysSinceView = (Date.now() - new Date(lastViewedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceView <= 7) recencyScore = 30;
    else if (daysSinceView <= 30) recencyScore = 15;
    else recencyScore = 5;
  }

  return Math.round(viewScore + recencyScore);
}

// flag datasets that basically nobody is using - candidates to archive
export function isLowActivity({ viewCount, lastViewedAt }) {
  if (viewCount === 0) return true;
  if (!lastViewedAt) return true;

  const daysSinceView = (Date.now() - new Date(lastViewedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceView > 30 && viewCount < 3;
}