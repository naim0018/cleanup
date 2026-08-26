import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { routesGenerator } from "@/utils/Generator/RoutesGenerator";

import { publicRoutes } from "./PublicRoutes";
import ProtectedRoutes from "./ProtectedRoutes";
import DashboardLayout from "@/Layout/DashboardLayout/DashboardLayout";

// CORE COMPONENTS (Always included)
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Auth/Login"));

const routes = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/",
    element: <ProtectedRoutes />,
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
