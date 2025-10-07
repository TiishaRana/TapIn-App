import React, { Suspense, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./i18n.js"; // Import i18n configuration

import { BrowserRouter } from "react-router-dom"; // Corrected import for BrowserRouter

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
