import { createRoot } from "react-dom/client";
import { initializeMsal } from "./config/msal";
import App from "./App.tsx";
import "./index.css";

// Initialize MSAL before React renders — handles any pending redirect
initializeMsal().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
