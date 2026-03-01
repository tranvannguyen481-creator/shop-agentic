import { lazy, Suspense, type ComponentType } from "react";
import { Route, Routes } from "react-router-dom";
import { Spinner } from "../shared/components/ui";
import { ProtectedRoute, PublicRoute } from "../shared/guards";
import NotFoundPage from "./not-found-page";
import { APP_PATHS } from "./route-config";

interface GeneratedRoute {
  path: string;
  component: ComponentType;
}

const PUBLIC_PATHS = new Set<string>([
  APP_PATHS.landing,
  APP_PATHS.signIn,
  APP_PATHS.signUp,
  APP_PATHS.signUpEmail,
]);

// Eagerly load only the `routePath` string export — zero component code loaded
const routePathMeta = import.meta.glob<string>(
  "../features/**/pages/**/index.tsx",
  { eager: true, import: "routePath" },
);

const routeLoaders = import.meta.glob<{ default: ComponentType }>(
  "../features/**/pages/**/index.tsx",
);

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const normalizePath = (value: string) => {
  if (!value) return APP_PATHS.landing;
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  if (withLeadingSlash === APP_PATHS.landing) return withLeadingSlash;
  return withLeadingSlash.replace(/\/+$/, "");
};

const derivePathFromFile = (fileKey: string) => {
  const pageMatch = fileKey.match(/pages\/(.+)\/index\.tsx$/);
  const pagePath = pageMatch?.[1] ?? "";

  const segments = trimSlashes(pagePath)
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/-page$/, ""));

  const routePath = `/${segments.join("/")}`;
  return routePath === "/landing" ? APP_PATHS.landing : routePath;
};

const getGeneratedRoutes = (): GeneratedRoute[] => {
  const routeKeys = Object.keys(routeLoaders).sort();
  const seenPaths = new Set<string>();

  return routeKeys
    .map((routeKey) => {
      const configuredPath = (routePathMeta[routeKey] ?? "").trim();
      const path = normalizePath(
        configuredPath || derivePathFromFile(routeKey),
      );

      if (seenPaths.has(path)) return null;
      seenPaths.add(path);

      const component = lazy(routeLoaders[routeKey]) as ComponentType;

      return { path, component };
    })
    .filter((item): item is GeneratedRoute => item !== null)
    .sort((a, b) => {
      if (a.path === APP_PATHS.landing) return -1;
      if (b.path === APP_PATHS.landing) return 1;
      return a.path.localeCompare(b.path);
    });
};

const PageFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "40vh",
    }}
  >
    <Spinner size={28} />
  </div>
);

function FileBasedRoutes() {
  const routes = getGeneratedRoutes();
  const publicRoutes = routes.filter((route) => PUBLIC_PATHS.has(route.path));
  const protectedRoutes = routes.filter(
    (route) => !PUBLIC_PATHS.has(route.path),
  );

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<PublicRoute />}>
          {publicRoutes.map((route) => {
            const PageComponent = route.component;
            return (
              <Route
                key={route.path}
                path={route.path}
                element={<PageComponent />}
              />
            );
          })}
        </Route>

        <Route element={<ProtectedRoute />}>
          {protectedRoutes.map((route) => {
            const PageComponent = route.component;
            return (
              <Route
                key={route.path}
                path={route.path}
                element={<PageComponent />}
              />
            );
          })}
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default FileBasedRoutes;
