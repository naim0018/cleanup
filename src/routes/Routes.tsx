import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { routesGenerator } from "@/utils/Generator/RoutesGenerator";

import { publicRoutes } from "./PublicRoutes";
import ProtectedRoutes from "./ProtectedRoutes";
import DashboardLayout from "@/Layout/DashboardLayout/DashboardLayout";

import { LoginSkeleton } from "@/common/Skeleton";

// CORE COMPONENTS (Always included)
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Auth/Login"));
const ErrorPage = lazy(() => import("@/pages/ErrorPage"));

const routes = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<LoginSkeleton />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/",
    element: <ProtectedRoutes />,
    errorElement: (
      <Suspense fallback={<div>Loading Error Page...</div>}>
        <ErrorPage />
      </Suspense>
    ),
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          ...routesGenerator(publicRoutes),
        ],
      }
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default routes;
