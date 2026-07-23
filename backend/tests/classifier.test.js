import { test } from "node:test";
import assert from "node:assert";
import { classifyColumn } from "../src/services/classifier.js";

test("detects email column by name", () => {
  const result = classifyColumn("email", ["a@test.com", "b@test.com"]);
  assert.strictEqual(result, "email");
});

test("detects email column by value pattern even with generic name", () => {
  const result = classifyColumn("contact_field", [
    "john@test.com",
    "jane@test.com",
    "mike@test.com",
  ]);
  assert.strictEqual(result, "email");
});

test("detects phone column by name", () => {
  const result = classifyColumn("phone_number", ["9876543210", "9123456780"]);
  assert.strictEqual(result, "phone");
});

test("detects name column by common header", () => {
  const result = classifyColumn("customer_name", ["John Doe", "Jane Smith"]);
  assert.strictEqual(result, "name");
});

test("returns none for unrelated column", () => {
  const result = classifyColumn("transaction_amount", ["100", "200", "300"]);
  assert.strictEqual(result, "none");
});

test("handles empty values gracefully", () => {
  const result = classifyColumn("some_column", []);
  assert.strictEqual(result, "none");
});