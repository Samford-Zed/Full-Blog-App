import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function PrivateRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role?: string;
}) {
  const auth = useContext(AuthContext);
  if (!auth?.user) return <Navigate to='/login' />;
  if (role && auth.user.role !== role) return <Navigate to='/dashboard' />;
  return children;
}
