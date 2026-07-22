import express from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parseFile, inferColumnType } from "../services/parser.js";
import { classifyColumn } from "../services/classifier.js";
import {
  calculateMissingPercent,
  countInvalidValues,
  calculateQualityScore,
} from "../services/quality.js";
import { calculateTrustScore } from "../services/scoring.js";

const router = express.Router();
const prisma = new PrismaClient();

// same upload config as before, just reusing it here
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only CSV and Excel files are allowed"));
  },
});

// POST /api/datasets/upload - upload + process a file, save everything to db
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // step 1: parse the file
    const { columns, rows } = parseFile(req.file.path);

    if (columns.length === 0) {
      return res.status(400).json({ error: "File appears to be empty or unreadable" });
    }

    // step 2: for each column, figure out type + sensitivity + quality stats
    const columnStats = columns.map((colName) => {
      const values = rows.map((row) => row[colName]);
      const inferredType = inferColumnType(values);
      const sensitivityTag = classifyColumn(colName, values);
      const missingPercent = calculateMissingPercent(values);
      const invalidCount = countInvalidValues(values, inferredType);

      return {
        name: colName,
        inferredType,
        sensitivityTag,
        missingPercent,
        invalidCount,
      };
    });

    // step 3: calculate quality score for the whole dataset
    const qualityScore = calculateQualityScore({ columns, rows, columnStats });

    // step 4: trust score needs quality score + column classification info
    const trustScore = calculateTrustScore({ qualityScore, columnStats });

    // step 5: save dataset + columns to db
    const dataset = await prisma.dataset.create({
      data: {
        filename: req.file.originalname,
        rowCount: rows.length,
        columnCount: columns.length,
        qualityScore,
        trustScore,
        columns: {
          create: columnStats.map((c) => ({
            name: c.name,
            inferredType: c.inferredType,
            sensitivityTag: c.sensitivityTag,
            missingPercent: c.missingPercent,
            invalidCount: c.invalidCount,
          })),
        },
      },
      include: { columns: true },
    });

    res.json(dataset);
  } catch (err) {
    console.error("upload processing failed:", err);
    res.status(500).json({ error: err.message || "Something went wrong processing the file" });
  }
});

// GET /api/datasets - list all datasets for the dashboard
router.get("/", async (req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { uploadedAt: "desc" },
    });
    res.json(datasets);
  } catch (err) {
    console.error("failed to fetch datasets:", err);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
});

// GET /api/datasets/:id - get one dataset with column details, also bump view count
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // bump view count + last viewed time for the value score
    const dataset = await prisma.dataset.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
      include: { columns: true },
    });

    res.json(dataset);
  } catch (err) {
    console.error("failed to fetch dataset:", err);
    res.status(404).json({ error: "Dataset not found" });
  }
});

// PATCH /api/datasets/:id/columns/:columnId - manual override for sensitivity tag
router.patch("/:id/columns/:columnId", async (req, res) => {
  try {
    const { columnId } = req.params;
    const { sensitivityTag } = req.body;

    const updated = await prisma.column.update({
      where: { id: parseInt(columnId) },
      data: {
        sensitivityTag,
        isManualOverride: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("failed to update column:", err);
    res.status(500).json({ error: "Failed to update column" });
  }
});

export default router;