import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bzs-edit/admin/admin.css";
import "./papo.css";
import { AdminApp } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
