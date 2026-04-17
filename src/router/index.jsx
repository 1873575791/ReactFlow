import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../layout";
import Home from "../pages/Home";
import ReactFlowPage from "../pages/ReactFlow";
import FPSGame from "../pages/FPS";

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
    ],
  },
];

export const router = createBrowserRouter(routes);
