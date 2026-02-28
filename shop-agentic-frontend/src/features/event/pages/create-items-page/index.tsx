import { APP_PATHS } from "../../../../app/route-config";
import AppLayout from "../../../../shared/layouts/app-layout";
import CreateItemsFormView from "../../components/create-items-form-view";
import { useCreateItemsPage } from "../../hooks/use-create-items-page";
import { useEventWizardSync } from "../../hooks/use-event-wizard-sync";

export const routePath = APP_PATHS.createEventItems;

function CreateItemsPage() {
  useEventWizardSync({
    currentStepPath: APP_PATHS.createEventItems,
  });

  const viewModel = useCreateItemsPage();

  return (
    <AppLayout>
      <CreateItemsFormView viewModel={viewModel} />
    </AppLayout>
  );
}

export default CreateItemsPage;
