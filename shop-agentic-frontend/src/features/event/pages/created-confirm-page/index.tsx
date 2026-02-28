import { APP_PATHS } from "../../../../app/route-config";
import { APP_TABS } from "../../../../shared/components/app-shell/app-tabs";
import AppLayout from "../../../../shared/layouts/app-layout";
import CreatedConfirmView from "../../components/created-confirm-view";
import { useEventWizardSync } from "../../hooks/use-event-wizard-sync";

export const routePath = APP_PATHS.createdConfirm;

function CreatedConfirmPage() {
  useEventWizardSync({
    currentStepPath: APP_PATHS.createdConfirm,
  });

  return (
    <AppLayout activeTab={APP_TABS.all}>
      <CreatedConfirmView />
    </AppLayout>
  );
}

export default CreatedConfirmPage;
