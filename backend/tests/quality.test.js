import { test } from "node:test";
import assert from "node:assert";
import {
  calculateMissingPercent,
  countDuplicateRows,
  countInvalidValues,
  calculateQualityScore,
} from "../src/services/quality.js";

test("calculates missing percent correctly", () => {
  const values = ["a", "", "b", null, "c"];
  const result = calculateMissingPercent(values);
  assert.strictEqual(result, 40); // 2 out of 5 missing
});

test("returns 0 missing percent for fully populated column", () => {
  const values = ["a", "b", "c"];
  assert.strictEqual(calculateMissingPercent(values), 0);
});

test("counts duplicate rows correctly", () => {
  const rows = [
    { name: "John", age: 30 },
    { name: "Jane", age: 25 },
    { name: "John", age: 30 }, // duplicate of row 1
  ];
  assert.strictEqual(countDuplicateRows(rows), 1);
});

test("counts invalid values in a number column", () => {
  const values = ["10", "20", "abc", "30"];
  const result = countInvalidValues(values, "number");
  assert.strictEqual(result, 1);
});

test("quality score is 100 for a perfectly clean dataset", () => {
  const columns = ["name", "age"];
  const rows = [
    { name: "John", age: "30" },
    { name: "Jane", age: "25" },
  ];
  const columnStats = [
    { missingPercent: 0, invalidCount: 0 },
    { missingPercent: 0, invalidCount: 0 },
  ];
  const score = calculateQualityScore({ columns, rows, columnStats });
  assert.strictEqual(score, 100);
});

test("quality score drops when there is missing data", () => {
  const columns = ["name"];
  const rows = [{ name: "John" }, { name: "" }];
  const columnStats = [{ missingPercent: 50, invalidCount: 0 }];
  const score = calculateQualityScore({ columns, rows, columnStats });
  assert.ok(score < 100);
});