import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Mostrar la pantalla de carga por al menos 1.5 segundos
setTimeout(() => {
  createRoot(document.getElementById("root")!).render(<App />);
}, 1500);
