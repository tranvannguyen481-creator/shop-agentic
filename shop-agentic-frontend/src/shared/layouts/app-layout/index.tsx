import { ReactNode } from "react";
import AppFooterNav from "../../components/app-shell/app-footer-nav";
import AppHeader from "../../components/app-shell/app-header";
import styles from "./index.module.scss";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles["app-page"]}>
      <AppHeader />

      <main className={styles.content}>{children}</main>

      <AppFooterNav />
    </div>
  );
}

export default AppLayout;
