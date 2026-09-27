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
import Clients from "./pages/Clients";
import Tasks from "./pages/Tasks";
import Freelancers from "./pages/Freelancers";
import Meetings from "./pages/Meetings";

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
          <Route path="clients" element={<RequireAccess access="clients"><Clients /></RequireAccess>} />
          <Route path="projects" element={<RequireAccess access="projects"><Projects /></RequireAccess>} />
          <Route path="tasks" element={<RequireAccess access="projects"><Tasks /></RequireAccess>} />
          <Route path="meetings" element={<RequireAccess access="projects"><Meetings /></RequireAccess>} />
          <Route path="freelancers" element={<RequireAccess access="projects"><Freelancers /></RequireAccess>} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="chat" element={<RequireAccess access="chat"><Chat /></RequireAccess>} />
          <Route path="finance" element={<RequireAccess access="finance"><Finance /></RequireAccess>} />
        </Route>
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
