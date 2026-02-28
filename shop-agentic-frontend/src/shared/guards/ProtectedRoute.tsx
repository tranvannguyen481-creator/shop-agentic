import { Navigate, Outlet, useLocation } from "react-router-dom";
import { APP_PATHS } from "../../app/route-config";
import { Spinner } from "../components/ui";
import { useCurrentUserQuery } from "../hooks/use-current-user-query";

function ProtectedRoute() {
  const location = useLocation();
  const { data: currentUser, isPending } = useCurrentUserQuery();

  if (isPending) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Navigate to={APP_PATHS.signIn} state={{ from: location }} replace />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
