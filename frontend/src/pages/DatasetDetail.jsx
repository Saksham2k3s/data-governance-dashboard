import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDataset, updateColumnTag } from "../api/client";
import {
  ArrowLeft,
  Rows3,
  Columns3,
  ShieldCheck,
  Gauge,
  Gem,
  Eye,
  Copy,
  Table2,
} from "lucide-react";

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

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading dataset…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!dataset) return null;

  return (
    <div className="page">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} />
        Back to Dashboard
      </Link>

      <div className="detail-header">
        <h1>{dataset.filename}</h1>
      </div>

      <div className="stat-grid">
        <Stat icon={<Rows3 size={15} />} label="Rows" value={dataset.rowCount.toLocaleString()} />
        <Stat icon={<Columns3 size={15} />} label="Columns" value={dataset.columnCount} />
        <Stat icon={<Gauge size={15} />} label="Quality Score" value={dataset.qualityScore ?? "—"} />
        <Stat icon={<ShieldCheck size={15} />} label="Trust Score" value={dataset.trustScore ?? "—"} />
        <Stat icon={<Gem size={15} />} label="Value Score" value={dataset.valueScore ?? "—"} />
        <Stat icon={<Eye size={15} />} label="Views" value={dataset.viewCount} />
        <Stat icon={<Copy size={15} />} label="Duplicate Rows" value={dataset.duplicateRowCount ?? "—"} />
      </div>

      <h2 className="section-title">
        <Table2 size={16} />
        Columns <span className="count">({dataset.columns.length})</span>
      </h2>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Sensitivity Tag</th>
              <th>Missing %</th>
              <th>Invalid Count</th>
            </tr>
          </thead>
          <tbody>
            {dataset.columns.map((col) => (
              <tr key={col.id}>
                <td>{col.name}</td>
                <td>
                  <span className="type-badge">{col.inferredType}</span>
                </td>
                <td>
                  <select
                    className={`tag-select tag-${col.sensitivityTag}`}
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
                    <span className="manual-badge">(manual)</span>
                  )}
                </td>
                <td className="mono">{col.missingPercent}%</td>
                <td className="mono">{col.invalidCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {icon}
        {label}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default DatasetDetail;