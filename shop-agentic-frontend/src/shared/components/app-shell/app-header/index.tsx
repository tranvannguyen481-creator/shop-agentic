import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import { Avatar, Button } from "../../ui";
import styles from "./index.module.scss";

function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className={styles["home-header"]}>
      <div className={styles["header-inner"]}>
        <div className={styles.brand}>
          <h1>SHOP AGENTIC GROUPBUY</h1>
          <p>
            Powered by <span>shop-agentic</span>
          </p>
        </div>

        <div className={styles["header-actions"]}>
          <Button
            type="button"
            variant="text"
            aria-label="Messages"
            className={styles["icon-btn"]}
          >
            <Mail className={styles.icon} aria-hidden="true" />
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
              size={34}
              className={styles["avatar-view"]}
            />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
