import { Navigate, Outlet } from "react-router-dom";
import { APP_PATHS } from "../../app/route-config";
import { Spinner } from "../components/ui";
import { useCurrentUserQuery } from "../hooks/use-current-user-query";

function PublicRoute() {
  const { data: currentUser, isPending } = useCurrentUserQuery();

  if (isPending) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to={APP_PATHS.home} replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
