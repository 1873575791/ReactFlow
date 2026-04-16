import { createBrowserRouter } from "react-router-dom";
import Layout from "../layout";
import Home from "../pages/Home";
import ReactFlowPage from "../pages/ReactFlow";

export const routes = [
  {
    path: "/",
    element: <Layout />,
    name: "Layout",
    children: [
      {
        index: true,
        element: <Home />,
        name: "Home",
      },
      {
        path: "/reactflow",
        name: "ReactFlow",
        element: <ReactFlowPage />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
