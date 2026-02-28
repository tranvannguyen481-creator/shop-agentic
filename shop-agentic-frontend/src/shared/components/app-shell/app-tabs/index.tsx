import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import { Tabs } from "../../ui";
import styles from "./index.module.scss";

export const APP_TABS = {
  all: "all",
  purchase: "purchase",
  group: "group",
} as const;

export type AppTabKey = (typeof APP_TABS)[keyof typeof APP_TABS];

const APP_TAB_ITEMS: ReadonlyArray<{ key: AppTabKey; label: string }> = [
  { key: APP_TABS.all, label: "All" },
  { key: APP_TABS.purchase, label: "My Purchase" },
  { key: APP_TABS.group, label: "My Group" },
];

const APP_TAB_KEYS = APP_TAB_ITEMS.map((item) => item.key);

export const isAppTabKey = (value: string | null): value is AppTabKey => {
  if (!value) {
    return false;
  }

  return APP_TAB_KEYS.includes(value as AppTabKey);
};

interface AppTabsProps {
  activeTab: AppTabKey;
  tabPaths?: Record<AppTabKey, string>;
}

const DEFAULT_TAB_PATHS: Record<AppTabKey, string> = {
  [APP_TABS.all]: APP_PATHS.home,
  [APP_TABS.purchase]: APP_PATHS.listMyPurchases,
  [APP_TABS.group]: APP_PATHS.listMyGroups,
};

function AppTabs({ activeTab, tabPaths = DEFAULT_TAB_PATHS }: AppTabsProps) {
  const navigate = useNavigate();

  const handleNavigate = (tab: AppTabKey) => {
    navigate(tabPaths[tab]);
  };

  return (
    <div className={styles.shell}>
      <Tabs
        items={APP_TAB_ITEMS}
        activeKey={activeTab}
        onChange={(tabKey) => handleNavigate(tabKey as AppTabKey)}
        className={styles.tabs}
        tabClassName={styles.tab}
        activeTabClassName={styles.active}
      />
    </div>
  );
}

export default AppTabs;
