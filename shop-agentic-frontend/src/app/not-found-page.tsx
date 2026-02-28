import { Link } from "react-router-dom";
import { APP_PATHS } from "./route-config";

function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div>
        <h1>404</h1>
        <p>Page not found.</p>
        <Link to={APP_PATHS.landing}>Go to Home</Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
