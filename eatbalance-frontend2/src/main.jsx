import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "../styles/reset.css";
import App from "./App.jsx";

// 👉 importa el provider del hook
import { AuthProvider } from "./components/hooks/useAuth";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
