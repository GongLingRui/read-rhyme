import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import Index from "./pages/Index";
import Reader from "./pages/Reader";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import RAGQA from "./pages/RAGQA";
import Settings from "./pages/Settings";
import LoRATraining from "./pages/LoRATraining";
import VoiceStyling from "./pages/VoiceStyling";
import VoiceClone from "./pages/VoiceClone";
import AudioTools from "./pages/AudioTools";
import AudioPreview from "./pages/AudioPreview";
import BatchOperations from "./pages/BatchOperations";
import CosyVoice from "./pages/CosyVoice";

const queryClient = new QueryClient();

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Check localStorage directly as fallback during hydration
  const hasToken = !!localStorage.getItem("auth_token");

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initAuth = useAuthStore((state) => state.initAuth);

  // Initialize auth on app mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reader/:bookId"
              element={
                <ProtectedRoute>
                  <Reader />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rag"
              element={
                <ProtectedRoute>
                  <RAGQA />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/lora"
              element={
                <ProtectedRoute>
                  <LoRATraining />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice-styling"
              element={
                <ProtectedRoute>
                  <VoiceStyling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice-clone"
              element={
                <ProtectedRoute>
                  <VoiceClone />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audio-tools"
              element={
                <ProtectedRoute>
                  <AudioTools />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audio-preview"
              element={
                <ProtectedRoute>
                  <AudioPreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/batch-operations"
              element={
                <ProtectedRoute>
                  <BatchOperations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cosy-voice"
              element={
                <ProtectedRoute>
                  <CosyVoice />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
