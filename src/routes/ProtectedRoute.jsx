import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 * @param {JSX.Element} children - Component to render
 * @param {Array} roles - Allowed roles (role keys)
 */
const ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));


console.log("PROTECTED TOKEN:", token);
console.log("PROTECTED USER:", user);
console.log("PROTECTED ROLE:", user?.role);

  // not logged in
  if (!token || !user) return <Navigate to="/login" replace />;

  // role object from backend
  const userRoleKey = user.role?.key;

  if (roles && !roles.includes(userRoleKey)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
