/* eslint-disable react-refresh/only-export-components -- 路由模块导出 router 实例，lazy 页面常量非组件 */
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { RoleGate } from "@/components/auth/RoleGate";
import { PageStub } from "@/components/PageStub";
import { AppShell } from "@/layouts/AppShell";
import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";

/** 路由级代码分割：首屏只保留首页与布局，其余页面按需加载（懒加载 chunk）。 */
const AdminAiImportPage = lazy(() =>
  import("@/pages/AdminAiImportPage").then((m) => ({ default: m.AdminAiImportPage })),
);
const AdminAiImportStatsPage = lazy(() =>
  import("@/pages/AdminAiImportStatsPage").then((m) => ({
    default: m.AdminAiImportStatsPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("@/pages/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage })),
);
const DiscoverPage = lazy(() =>
  import("@/pages/DiscoverPage").then((m) => ({ default: m.DiscoverPage })),
);
const GuestPracticePage = lazy(() =>
  import("@/pages/GuestPracticePage").then((m) => ({ default: m.GuestPracticePage })),
);
const BankBrowsePage = lazy(() =>
  import("@/pages/BankBrowsePage").then((m) => ({ default: m.BankBrowsePage })),
);
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const BankDetailPage = lazy(() =>
  import("@/pages/BankDetailPage").then((m) => ({ default: m.BankDetailPage })),
);
const ImportPage = lazy(() =>
  import("@/pages/ImportPage").then((m) => ({ default: m.ImportPage })),
);
const ManageBanksHome = lazy(() =>
  import("@/pages/ManageBanksHome").then((m) => ({ default: m.ManageBanksHome })),
);
const ManageBanksLayout = lazy(() =>
  import("@/pages/ManageBanksLayout").then((m) => ({ default: m.ManageBanksLayout })),
);
const PracticeBanksPage = lazy(() =>
  import("@/pages/PracticeBanksPage").then((m) => ({ default: m.PracticeBanksPage })),
);
const PracticePage = lazy(() =>
  import("@/pages/PracticePage").then((m) => ({ default: m.PracticePage })),
);
const QuestionFormPage = lazy(() =>
  import("@/pages/QuestionFormPage").then((m) => ({ default: m.QuestionFormPage })),
);
const RecitePage = lazy(() =>
  import("@/pages/RecitePage").then((m) => ({ default: m.RecitePage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const WrongPracticePage = lazy(() =>
  import("@/pages/WrongPracticePage").then((m) => ({ default: m.WrongPracticePage })),
);
const WrongQuestionsPage = lazy(() =>
  import("@/pages/WrongQuestionsPage").then((m) => ({ default: m.WrongQuestionsPage })),
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/banks/browse/:rootId",
        element: <BankBrowsePage />,
      },
      {
        path: "/practice/guest/:bankId",
        element: <GuestPracticePage />,
      },
      {
        path: "/recite/guest/:bankId",
        element: <RecitePage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/app",
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate replace to="/app/banks" />,
          },
          {
            path: "discover",
            element: <DiscoverPage />,
          },
          {
            path: "banks",
            element: <PracticeBanksPage />,
          },
          {
            path: "manage/banks",
            element: (
              <RoleGate minRole="PREMIUM" premiumFeature>
                <ManageBanksLayout />
              </RoleGate>
            ),
            children: [
              {
                index: true,
                element: <ManageBanksHome />,
              },
              {
                path: ":bankId",
                element: <BankDetailPage />,
              },
              {
                path: ":bankId/questions/new",
                handle: { immersive: true },
                element: <QuestionFormPage />,
              },
              {
                path: ":bankId/questions/:id/edit",
                handle: { immersive: true },
                element: <QuestionFormPage />,
              },
              {
                path: ":bankId/import",
                element: <ImportPage />,
              },
            ],
          },
          {
            path: "practice/:bankId",
            handle: { immersive: true },
            element: <PracticePage />,
          },
          {
            path: "recite/:bankId",
            handle: { immersive: true },
            element: <RecitePage />,
          },
          {
            path: "wrong-questions",
            element: <WrongQuestionsPage />,
          },
          {
            path: "wrong-questions/practice",
            handle: { immersive: true },
            element: <WrongPracticePage />,
          },
          {
            path: "admin/users",
            element: (
              <RoleGate minRole="ADMIN">
                <AdminUsersPage />
              </RoleGate>
            ),
          },
          {
            path: "admin/ai-import",
            element: (
              <RoleGate minRole="ADMIN">
                <AdminAiImportPage />
              </RoleGate>
            ),
          },
          {
            path: "admin/ai-import/stats",
            element: (
              <RoleGate minRole="ADMIN">
                <AdminAiImportStatsPage />
              </RoleGate>
            ),
          },
        ],
      },
      {
        path: "*",
        element: <PageStub title="页面不存在" />,
      },
    ],
  },
]);
