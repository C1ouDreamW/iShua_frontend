import { createBrowserRouter, Navigate } from "react-router-dom";

import { PageStub } from "@/components/PageStub";
import { AppShell } from "@/layouts/AppShell";
import { GuestPracticePage } from "@/pages/GuestPracticePage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
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
        element: <Navigate replace to="/app/wrong-questions" />,
      },
      {
        path: "banks",
        element: (
          <PageStub
            description="P6 将接入 PREMIUM 题库列表、新建、编辑和删除。"
            title="我的题库"
          />
        ),
      },
      {
        path: "banks/:bankId",
        element: (
          <PageStub
            description="P7 将接入题库详情、试题分页搜索和管理入口。"
            title="题库详情"
          />
        ),
      },
      {
        path: "banks/:bankId/questions/new",
        element: (
          <PageStub
            description="P7 将接入整页新建试题表单。"
            title="新建试题"
          />
        ),
      },
      {
        path: "banks/:bankId/questions/:id/edit",
        element: (
          <PageStub
            description="P7 将接入整页编辑试题表单，并走 PUT 全量更新。"
            title="编辑试题"
          />
        ),
      },
      {
        path: "banks/:bankId/import",
        element: (
          <PageStub
            description="P8 将接入 AI 导入四步向导。"
            title="AI 智能导入"
          />
        ),
      },
      {
        path: "practice/:bankId",
        handle: { immersive: true },
        element: (
          <PageStub
            description="P3 将接入登录刷题闭环。"
            title="题库练习"
          />
        ),
      },
      {
        path: "wrong-questions",
        element: (
          <PageStub
            description="P4 将接入错题列表、筛选、移出和重刷入口。"
            title="错题本"
          />
        ),
      },
      {
        path: "wrong-questions/practice",
        handle: { immersive: true },
        element: (
          <PageStub
            description="P4 将接入独立错题重刷页面。"
            title="错题重刷"
          />
        ),
      },
      {
        path: "admin/users",
        element: (
          <PageStub
            description="P5 将接入 ADMIN 占位页。"
            title="管理占位"
          />
        ),
      },
    ],
  },
  {
    path: "*",
    element: <PageStub title="页面不存在" />,
  },
]);
