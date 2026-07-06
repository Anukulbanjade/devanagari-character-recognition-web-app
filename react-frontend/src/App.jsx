import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

const App = () => (
  <Router>
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Auth />} />
    </Routes>
  </Router>
);

export default App;
