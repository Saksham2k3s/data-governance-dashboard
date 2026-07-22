import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDataset, updateColumnTag } from "../api/client";

const TAG_OPTIONS = ["none", "email", "phone", "name", "id"];

function DatasetDetail() {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDataset = async () => {
    try {
      setLoading(true);
      const res = await getDataset(id);
      setDataset(res.data);
    } catch (err) {
      setError("Failed to load dataset");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleTagChange = async (columnId, newTag) => {
    try {
      await updateColumnTag(id, columnId, newTag);
      // update locally so we dont need a full refetch
      setDataset((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === columnId ? { ...c, sensitivityTag: newTag, isManualOverride: true } : c
        ),
      }));
    } catch (err) {
      alert("Failed to update tag");
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  if (error) return <p style={{ padding: 24, color: "red" }}>{error}</p>;
  if (!dataset) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
      <Link to="/">&larr; Back to Dashboard</Link>
      <h1>{dataset.filename}</h1>

      <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
        <Stat label="Rows" value={dataset.rowCount.toLocaleString()} />
        <Stat label="Columns" value={dataset.columnCount} />
        <Stat label="Quality Score" value={dataset.qualityScore ?? "-"} />
        <Stat label="Trust Score" value={dataset.trustScore ?? "-"} />
        <Stat label="Value Score" value={dataset.valueScore ?? "-"} />
        <Stat label="Views" value={dataset.viewCount} />
        <Stat label="Duplicate Rows" value={dataset.duplicateRowCount ?? "-"} />
      </div>

      <h2>Columns</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Type</th>
            <th style={{ padding: 8 }}>Sensitivity Tag</th>
            <th style={{ padding: 8 }}>Missing %</th>
            <th style={{ padding: 8 }}>Invalid Count</th>
          </tr>
        </thead>
        <tbody>
          {dataset.columns.map((col) => (
            <tr key={col.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{col.name}</td>
              <td style={{ padding: 8 }}>{col.inferredType}</td>
              <td style={{ padding: 8 }}>
                <select
                  value={col.sensitivityTag}
                  onChange={(e) => handleTagChange(col.id, e.target.value)}
                >
                  {TAG_OPTIONS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                {col.isManualOverride && (
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>
                    (manual)
                  </span>
                )}
              </td>
              <td style={{ padding: 8 }}>{col.missingPercent}%</td>
              <td style={{ padding: 8 }}>{col.invalidCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: 12, background: "#f5f5f5", borderRadius: 8, minWidth: 100 }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export default DatasetDetail;