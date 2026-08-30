import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";

import { RouteFallback } from "@/components/RouteFallback";

export function RootLayout() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
      <ScrollRestoration />
    </>
  );
}
