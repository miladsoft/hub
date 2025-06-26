import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AngorLayout } from "./components/AngorLayout";
import HomePage from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectDebugPage } from "./pages/ProjectDebugPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { TrendingPage } from "./pages/TrendingPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DebugPage } from "./pages/DebugPage";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AngorLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
          <Route path="/project/:projectId/debug" element={<ProjectDebugPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AngorLayout>
    </BrowserRouter>
  );
}
export default AppRouter;