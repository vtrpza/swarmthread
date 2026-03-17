import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import RunDetailPage from "./pages/RunDetailPage"
import FeedPage from "./pages/FeedPage"
import ThreadPage from "./pages/ThreadPage"
import AgentPage from "./pages/AgentPage"
import AnalysisPage from "./pages/AnalysisPage"
import SettingsPage from "./pages/SettingsPage"
import HistoryPage from "./pages/HistoryPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="runs/:runId" element={<RunDetailPage />} />
            <Route path="runs/:runId/feed" element={<FeedPage />} />
            <Route path="runs/:runId/threads/:postId" element={<ThreadPage />} />
            <Route path="runs/:runId/agents/:agentId" element={<AgentPage />} />
            <Route path="runs/:runId/analysis" element={<AnalysisPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
