import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import PrintEvent from "./pages/PrintEvent";
import ProtectedRoute from "./components/ProtectedRoute";
import { CreateEvent } from "./components/CreateEvent";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/create",
    element: <ProtectedRoute><CreateEvent /></ProtectedRoute>,
  },
  {
    path: "/event/:id",
    element: <ProtectedRoute><EventDetails /></ProtectedRoute>,
  },
  {
    path: "/event/:id/print",
    element: <ProtectedRoute><PrintEvent /></ProtectedRoute>,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);