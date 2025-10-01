import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app"; // <-- match your file name *exactly* (you have app.tsx)

import "./index.css"; // optional, but helps ensure full-height + dark bg

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing <div id='root'> in index.html");

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
