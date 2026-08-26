import { lazy } from "react";
import Loadable from "@/utils/Loadable";
import { PublicSkeleton } from "@/common/Skeleton/Public/PublicSkeleton";

const Home = Loadable(
  lazy(() => import("@/pages/Public/Home/Home")),
  PublicSkeleton
);

export const publicRoutes = [
  {
    label: "Home",
    index: true,
    path: "/",
    element: <Home />,
  }
];
