import axios from "axios";

// change this if backend runs on a different port when deployed
const API_BASE_URL = "https://data-governance-dashboard.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getDatasets = () => api.get("/datasets");
export const getDataset = (id) => api.get(`/datasets/${id}`);
export const uploadDataset = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/datasets/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const updateColumnTag = (datasetId, columnId, sensitivityTag) =>
  api.patch(`/datasets/${datasetId}/columns/${columnId}`, { sensitivityTag });

export default api;