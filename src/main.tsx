import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { useAuthStore } from "./stores/authStore";
import "./index.css";

// Initialize auth from localStorage
useAuthStore.getState().initAuth();

createRoot(document.getElementById("root")!).render(<App />);
