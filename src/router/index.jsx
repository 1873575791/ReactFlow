import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../layout";
import Home from "../pages/Home";
import ReactFlowPage from "../pages/ReactFlow";
import FPSGame from "../pages/FPS";
import ThreeDCardDemo from "../pages/3DCard";
import MarkdownViewer from "../pages/MarkdownViewer";
import CalendarPage from "../pages/Calendar";

export const routes = [
  {
    path: "/",
    element: <Layout />,
    name: "Layout",
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        index: true,
        path: "/home",
        element: <Home />,
        name: "Home",
      },
      {
        path: "/reactflow",
        name: "ReactFlow",
        element: <ReactFlowPage />,
      },
      {
        path: "/fps",
        name: "FPS Game",
        element: <FPSGame />,
      },
      {
        path: "/3dcard",
        name: "3D Card",
        element: <ThreeDCardDemo />,
      },
      {
        path: "/md-viewer",
        name: "MD Viewer",
        element: <MarkdownViewer />,
      },
      {
        path: "/calendar",
        name: "Calendar",
        element: <CalendarPage />,
      },
    ],
  },
];

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createBrowserRouter(routes, { basename });
