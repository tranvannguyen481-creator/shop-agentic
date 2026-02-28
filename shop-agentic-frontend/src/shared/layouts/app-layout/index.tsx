import { ReactNode } from "react";
import AppFooterNav from "../../components/app-shell/app-footer-nav";
import AppHeader from "../../components/app-shell/app-header";
import AppTabs, {
  APP_TABS,
  type AppTabKey,
} from "../../components/app-shell/app-tabs";
import styles from "./index.module.scss";

interface AppLayoutProps {
  children: ReactNode;
  activeTab?: AppTabKey;
  tabPaths?: Record<AppTabKey, string>;
}

function AppLayout({
  children,
  activeTab = APP_TABS.all,
  tabPaths,
}: AppLayoutProps) {
  return (
    <div className={styles["home-page"]}>
      <AppHeader />
      <AppTabs activeTab={activeTab} tabPaths={tabPaths} />

      <main className={styles.content}>{children}</main>

      <AppFooterNav />
    </div>
  );
}

export default AppLayout;
