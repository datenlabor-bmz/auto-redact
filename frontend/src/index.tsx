import { StrictMode } from "react";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./style/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
