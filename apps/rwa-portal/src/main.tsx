import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>RWA Portal — Smart WaterVerse</h1>
      <p>Read-only portal for society admins. Coming in Sprint 9.</p>
      <p>Features: treatment volumes, recycling rates, water quality summary, compliance status.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
