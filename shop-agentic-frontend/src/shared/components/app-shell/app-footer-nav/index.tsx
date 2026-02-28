import { CalendarDays, Megaphone } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import { Button } from "../../ui";
import styles from "./index.module.scss";

function AppFooterNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActivePath = (targetPath: string) => {
    if (pathname === targetPath) {
      return true;
    }

    return pathname.startsWith(`${targetPath}/`);
  };

  return (
    <footer className={styles["bottom-nav"]}>
      <div className={styles["nav-inner"]}>
        <Button
          type="button"
          variant="text"
          className={`${styles["nav-item"]} ${
            isActivePath(APP_PATHS.createEvent) ? styles.active : ""
          }`}
          onClick={() => navigate(APP_PATHS.createEvent)}
        >
          <Megaphone className={styles.icon} aria-hidden="true" />
          <small>Host</small>
        </Button>
        <Button
          type="button"
          variant="text"
          className={`${styles["nav-item"]} ${
            isActivePath(APP_PATHS.listMyEvents) ? styles.active : ""
          }`}
          onClick={() => navigate(APP_PATHS.listMyEvents)}
        >
          <CalendarDays className={styles.icon} aria-hidden="true" />
          <small>Hosted Event</small>
        </Button>
      </div>
    </footer>
  );
}

export default AppFooterNav;
