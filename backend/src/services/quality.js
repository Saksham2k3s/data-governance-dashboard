// data quality checks for a dataset

export function calculateMissingPercent(values) {
  if (values.length === 0) return 0;
  const missingCount = values.filter(
    (v) => v === null || v === undefined || v === ""
  ).length;
  return Math.round((missingCount / values.length) * 100 * 100) / 100;
}

export function countDuplicateRows(rows) {
  const seen = new Set();
  let duplicates = 0;

  for (const row of rows) {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  }
  return duplicates;
}

export function countInvalidValues(values, inferredType) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");
  let invalidCount = 0;

  for (const v of nonEmpty) {
    if (inferredType === "number" && isNaN(v)) invalidCount++;
    if (inferredType === "date" && isNaN(Date.parse(v))) invalidCount++;
  }
  return invalidCount;
}

// combines everything into one quality score, 0-100
export function calculateQualityScore({ columns, rows, columnStats }) {
  if (rows.length === 0) return 0;

  const avgMissingPercent =
    columnStats.reduce((sum, c) => sum + c.missingPercent, 0) / columnStats.length;

  const duplicateRatio = countDuplicateRows(rows) / rows.length;

  const totalInvalid = columnStats.reduce((sum, c) => sum + c.invalidCount, 0);
  const totalValues = rows.length * columns.length;
  const invalidRatio = totalValues > 0 ? totalInvalid / totalValues : 0;

  // start at 100 and subtract penalties, missing values hurt the most
  let score = 100;
  score -= avgMissingPercent * 0.4;
  score -= duplicateRatio * 100 * 0.3;
  score -= invalidRatio * 100 * 0.3;

  return Math.max(0, Math.round(score * 100) / 100);
}