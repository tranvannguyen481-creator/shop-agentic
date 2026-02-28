import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { APP_TABS } from "../../../../shared/components/app-shell/app-tabs";
import SearchBar from "../../../../shared/components/search-bar";
import {
  Button,
  EmptyState,
  SectionCard,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import styles from "./index.module.scss";

function HomePage() {
  const [search, setSearch] = useState("");
  const handleSearchChange = (value: string) => setSearch(value);

  return (
    <AppLayout activeTab={APP_TABS.all}>
      <SearchBar value={search} onValueChange={handleSearchChange} />

      <SectionCard className={styles.panel}>
        <EmptyState
          icon={<CalendarDays />}
          title="No open events yet"
          description="You don’t have any open events right now. Browse categories to discover current group-buy deals."
          actions={
            <Button type="button" variant="secondary" fullWidth>
              Browse categories
            </Button>
          }
        />
      </SectionCard>
    </AppLayout>
  );
}

export default HomePage;
