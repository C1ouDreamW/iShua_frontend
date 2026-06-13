import { createBrowserRouter, Navigate } from "react-router-dom";

import { RoleGate } from "@/components/auth/RoleGate";
import { PageStub } from "@/components/PageStub";
import { AppShell } from "@/layouts/AppShell";
import { AdminAiImportPage } from "@/pages/AdminAiImportPage";
import { AdminAiImportStatsPage } from "@/pages/AdminAiImportStatsPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { GuestPracticePage } from "@/pages/GuestPracticePage";
import { BankBrowsePage } from "@/pages/BankBrowsePage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { BankDetailPage } from "@/pages/BankDetailPage";
import { ImportPage } from "@/pages/ImportPage";
import { ManageBanksHome } from "@/pages/ManageBanksHome";
import { ManageBanksLayout } from "@/pages/ManageBanksLayout";
import { PracticeBanksPage } from "@/pages/PracticeBanksPage";
import { PracticePage } from "@/pages/PracticePage";
import { QuestionFormPage } from "@/pages/QuestionFormPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { WrongPracticePage } from "@/pages/WrongPracticePage";
import { WrongQuestionsPage } from "@/pages/WrongQuestionsPage";

export const router = createBrowserRouter([
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
]);
