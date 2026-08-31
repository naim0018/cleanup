import { lazy } from "react";
import Loadable from "@/utils/Loadable";
import { PublicSkeleton } from "@/common/Skeleton/Public/PublicSkeleton";

const Home = Loadable(
  lazy(() => import("@/pages/Public/Home/Home")),
  PublicSkeleton
);

const GithubScan = Loadable(
  lazy(() => import("@/pages/Public/GithubScan/GithubScan")),
  PublicSkeleton
);

const Scanned = Loadable(
  lazy(() => import("@/pages/Public/Scanned/Scanned")),
  PublicSkeleton
);

export const publicRoutes = [
  {
    label: "Home",
    index: true,
    path: "/",
    element: <Home />,
  },
  {
    label: "Github Scan",
    path: "/github-scan",
    element: <GithubScan />,
  },
  {
    label: "Scanned",
    path: "/scanned",
    element: <Scanned />,
  }
];
