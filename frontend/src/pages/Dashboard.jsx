import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatasets, uploadDataset } from "../api/client";

function scoreClass(score) {
  if (score === null || score === undefined) return "score score-none";
  if (score >= 80) return "score score-good";
  if (score >= 50) return "score score-mid";
  return "score score-low";
}

function fileExt(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
}

function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const res = await getDatasets();
      setDatasets(res.data);
    } catch (err) {
      setError("Failed to load datasets. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      await uploadDataset(file);
      await loadDatasets();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="page">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">DG</div>
          <div>
            <h1>Data Governance Dashboard</h1>
            <p className="subtitle">Catalog, classify, and score every dataset you ingest</p>
          </div>
        </div>

        <label className="upload-btn" data-disabled={uploading}>
          {uploading ? "Uploading…" : "+ Upload Dataset"}
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading datasets…</div>
      ) : datasets.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📂</div>
          <p>No datasets yet. Upload a CSV or Excel file to build your catalog.</p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Rows</th>
                <th>Columns</th>
                <th>Quality</th>
                <th>Trust</th>
                <th>Value</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="filetype-badge">{fileExt(d.filename)}</span>
                    <Link className="filename-link" to={`/dataset/${d.id}`}>
                      {d.filename}
                    </Link>
                  </td>
                  <td className="mono">{d.rowCount.toLocaleString()}</td>
                  <td className="mono">{d.columnCount}</td>
                  <td>
                    <span className={scoreClass(d.qualityScore)}>
                      {d.qualityScore ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className={scoreClass(d.trustScore)}>
                      {d.trustScore ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className={scoreClass(d.valueScore)}>
                      {d.valueScore ?? "—"}
                    </span>
                  </td>
                  <td className="mono">{d.viewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;