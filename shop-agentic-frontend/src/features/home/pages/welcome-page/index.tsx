import { Building2 } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import { APP_TABS } from "../../../../shared/components/app-shell/app-tabs";
import AppLayout from "../../../../shared/layouts/app-layout";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.welcome;

function WelcomePage() {
  return (
    <AppLayout activeTab={APP_TABS.all}>
      <section className={styles.page}>
        <h2 className={styles.title}>Welcome to Shop Agentic</h2>

        <div className={styles.illustration} aria-hidden="true">
          <Building2 className={styles.icon} />
        </div>

        <p className={styles.headline}>
          Currently there is no deals hosted in your community
        </p>

        <p className={styles.description}>
          In the meantime,
          <a href="mailto:friends@shop-agentic.com"> leave a feedback </a>
          on how we can make Shop Agentic better
        </p>
      </section>
    </AppLayout>
  );
}

export default WelcomePage;
