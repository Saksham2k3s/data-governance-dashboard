import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import { parse } from "csv-parse/sync";

// figures out if its csv or excel and parses accordingly
export function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".csv") {
    return parseCSV(filePath);
  } else if (ext === ".xlsx" || ext === ".xls") {
    return parseExcel(filePath);
  } else {
    throw new Error("Unsupported file type");
  }
}

function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = parse(fileContent, {
    columns: true, // first row is headers
    skip_empty_lines: true,
    trim: true,
  });

  const columns = records.length > 0 ? Object.keys(records[0]) : [];
  return { columns, rows: records };
}

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // just taking first sheet for now
  const sheet = workbook.Sheets[sheetName];
  const records = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  const columns = records.length > 0 ? Object.keys(records[0]) : [];
  return { columns, rows: records };
}

// tries to guess column type from the values in it
export function inferColumnType(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");

  if (nonEmpty.length === 0) return "unknown";

  const isNumber = nonEmpty.every((v) => !isNaN(v) && v !== "");
  if (isNumber) return "number";

  const isDate = nonEmpty.every((v) => !isNaN(Date.parse(v)));
  if (isDate) return "date";

  const isBoolean = nonEmpty.every((v) =>
    ["true", "false", "0", "1"].includes(String(v).toLowerCase())
  );
  if (isBoolean) return "boolean";

  return "string";
}