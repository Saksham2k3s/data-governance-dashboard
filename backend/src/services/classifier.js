// checks column name + sample values to guess if its sensitive data

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[0-9][0-9\-\s\(\)]{7,14}$/;

export function classifyColumn(columnName, values) {
  const nameLower = columnName.toLowerCase();
  const sample = values.filter((v) => v !== null && v !== undefined && v !== "").slice(0, 20);

  // check column name first, its cheap and usually a good enough hint
  if (/email/.test(nameLower)) return "email";
  if (/phone|mobile|contact.?no/.test(nameLower)) return "phone";
  if (/^name$|full.?name|first.?name|last.?name|customer.?name/.test(nameLower)) return "name";
  if (/^id$|.*_id$|id.?number|aadhar|pan.?number|passport/.test(nameLower)) return "id";

  // name didnt match anything, check actual values now
  if (sample.length === 0) return "none";

  const emailMatches = sample.filter((v) => EMAIL_REGEX.test(String(v))).length;
  if (emailMatches / sample.length > 0.7) return "email";

  const phoneMatches = sample.filter((v) => PHONE_REGEX.test(String(v).replace(/\s/g, ""))).length;
  if (phoneMatches / sample.length > 0.7) return "phone";

  return "none";
}