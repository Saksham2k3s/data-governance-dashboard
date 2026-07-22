import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatasets, uploadDataset } from "../api/client";

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
      await loadDatasets(); // refresh list after upload
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset file input
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
      <h1>Data Governance Dashboard</h1>

      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#2563eb",
            color: "white",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload Dataset"}
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading datasets...</p>
      ) : datasets.length === 0 ? (
        <p>No datasets uploaded yet. Upload one to get started.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
              <th style={{ padding: 8 }}>Filename</th>
              <th style={{ padding: 8 }}>Rows</th>
              <th style={{ padding: 8 }}>Columns</th>
              <th style={{ padding: 8 }}>Quality</th>
              <th style={{ padding: 8 }}>Trust</th>
              <th style={{ padding: 8 }}>Value</th>
              <th style={{ padding: 8 }}>Views</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>
                  <Link to={`/dataset/${d.id}`}>{d.filename}</Link>
                </td>
                <td style={{ padding: 8 }}>{d.rowCount.toLocaleString()}</td>
                <td style={{ padding: 8 }}>{d.columnCount}</td>
                <td style={{ padding: 8 }}>{d.qualityScore ?? "-"}</td>
                <td style={{ padding: 8 }}>{d.trustScore ?? "-"}</td>
                <td style={{ padding: 8 }}>{d.valueScore ?? "-"}</td>
                <td style={{ padding: 8 }}>{d.viewCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;