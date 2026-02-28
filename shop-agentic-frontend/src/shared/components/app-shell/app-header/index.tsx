import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import { Avatar, Button } from "../../ui";
import styles from "./index.module.scss";

function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className={styles["app-header"]}>
      <div className={styles["header-inner"]}>
        <div className={styles.brand}>
          <div className={styles["brand-mark"]} aria-hidden="true">
            <span>S</span>
          </div>
          <span className={styles["brand-name"]}>ShopAgentic</span>
        </div>

        <div className={styles["header-actions"]}>
          <Button
            type="button"
            variant="text"
            aria-label="Notifications"
            className={styles["icon-btn"]}
          >
            <Bell className={styles.icon} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="text"
            aria-label="User profile"
            className={styles.avatar}
            onClick={() => navigate(APP_PATHS.userProfile)}
          >
            <Avatar
              name="Trung Tran"
              size={32}
              className={styles["avatar-view"]}
            />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
