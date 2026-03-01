import { Navigate, Outlet, useLocation } from "react-router-dom";
import { APP_PATHS } from "../../app/route-config";
import { Spinner } from "../components/ui";
import { useCurrentUserQuery } from "../hooks/use-current-user-query";

function PublicRoute() {
  const location = useLocation();
  const { data: currentUser, isPending } = useCurrentUserQuery();

  if (isPending) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (currentUser) {
    // Honour the original URL the user tried to visit before being sent
    // to the sign-in / sign-up page (set by ProtectedRoute).
    const fromState = (
      location.state as { from?: { pathname?: string; search?: string } } | null
    )?.from;

    const fromPath =
      typeof fromState?.pathname === "string" ? fromState.pathname : null;
    const fromSearch =
      typeof fromState?.search === "string" ? fromState.search : "";

    const redirectTo =
      fromPath && fromPath !== APP_PATHS.signIn && fromPath !== APP_PATHS.signUp
        ? fromPath + fromSearch
        : APP_PATHS.home;

    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
