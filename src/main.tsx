import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { installCloneFetchBarrier } from "./utils/cloneWriteBarrier";
import * as storage from "./utils/storageSync";

installCloneFetchBarrier();

// Debug helper for storageSync in local dev.
(window as any).storage = storage;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
