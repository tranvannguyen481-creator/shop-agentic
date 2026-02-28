import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { APP_PATHS } from "../../../../app/route-config";
import { APP_TABS } from "../../../../shared/components/app-shell/app-tabs";
import SearchBar from "../../../../shared/components/search-bar";
import {
  Button,
  EmptyState,
  SectionCard,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.listMyPurchases;

function ListMyPurchasesPage() {
  const [search, setSearch] = useState("");
  const handleSearchChange = (value: string) => setSearch(value);

  return (
    <AppLayout activeTab={APP_TABS.purchase}>
      <SearchBar value={search} onValueChange={handleSearchChange} />

      <SectionCard className={styles.panel}>
        <EmptyState
          icon={<ShoppingCart />}
          title="No purchases yet"
          description="You haven’t placed any orders yet. Explore events and start your first purchase."
          actions={
            <Button type="button" variant="outline" fullWidth>
              Explore events
            </Button>
          }
        />
      </SectionCard>
    </AppLayout>
  );
}

export default ListMyPurchasesPage;
