import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { AppToastViewport } from "@/components/AppToastViewport";
import { AppToastProvider } from "@/hooks/useAppToast";
import { AuthProvider } from "@/hooks/useAuth";
import { router } from "@/router";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppToastProvider>
      <AuthProvider>
        <AppToastViewport />
        <RouterProvider router={router} />
      </AuthProvider>
    </AppToastProvider>
  </StrictMode>,
);
