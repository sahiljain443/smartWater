import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MapPage } from "./pages/MapPage";
import { SiteDetailPage } from "./pages/SiteDetailPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";
import { LogbookPage } from "./pages/LogbookPage";
import { AssetsPage } from "./pages/AssetsPage";
import { Layout } from "./components/Layout";

export function App() {
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/sites/:siteId" element={<SiteDetailPage />} />
        <Route path="/work-orders" element={<WorkOrdersPage />} />
        <Route path="/logbook" element={<LogbookPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
