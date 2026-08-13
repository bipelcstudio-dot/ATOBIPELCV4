import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireAccess from "./components/RequireAccess";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Tickets from "./pages/Tickets";
import Chat from "./pages/Chat";
import Finance from "./pages/Finance";
import Projects from "./pages/Projects";

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<RequireAccess access="employees"><Employees /></RequireAccess>} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="chat" element={<RequireAccess access="chat"><Chat /></RequireAccess>} />
          <Route path="finance" element={<RequireAccess access="finance"><Finance /></RequireAccess>} />
          <Route path="projects" element={<RequireAccess access="projects"><Projects /></RequireAccess>} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
