import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DatasetDetail from "./pages/DatasetDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dataset/:id" element={<DatasetDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;