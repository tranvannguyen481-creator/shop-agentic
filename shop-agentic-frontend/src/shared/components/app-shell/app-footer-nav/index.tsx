import {
  CalendarDays,
  LayoutGrid,
  Megaphone,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import { Button } from "../../ui";
import styles from "./index.module.scss";

const NAV_ITEMS = [
  { path: APP_PATHS.home, icon: LayoutGrid, label: "Explore" },
  { path: APP_PATHS.listMyPurchases, icon: ShoppingBag, label: "Purchases" },
  { path: APP_PATHS.listMyGroups, icon: Users, label: "Groups" },
  { path: APP_PATHS.createEvent, icon: Megaphone, label: "Host" },
  { path: APP_PATHS.listMyEvents, icon: CalendarDays, label: "My Events" },
] as const;

function AppFooterNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (targetPath: string) =>
    pathname === targetPath || pathname.startsWith(`${targetPath}/`);

  return (
    <footer className={styles["bottom-nav"]}>
      <nav className={styles["nav-inner"]}>
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <Button
            key={path}
            type="button"
            variant="text"
            className={`${styles["nav-item"]} ${isActive(path) ? styles.active : ""}`}
            onClick={() => navigate(path)}
          >
            <Icon className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
          </Button>
        ))}
      </nav>
    </footer>
  );
}

export default AppFooterNav;
