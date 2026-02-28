import { useSearchParams } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import AppLayout from "../../../../shared/layouts/app-layout";
import CreateEventFormView from "../../components/create-event-form-view";
import { useCreateEventPage } from "../../hooks/use-create-event-page";
import { useEventWizardSync } from "../../hooks/use-event-wizard-sync";
import styles from "../create-event-page/index.module.scss";

export const routePath = APP_PATHS.updateEvent;

function UpdateEventPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("id")?.trim() ?? "";

  useEventWizardSync({
    currentStepPath: APP_PATHS.createEvent,
    mode: "edit",
    resourceId: eventId,
  });

  const viewModel = useCreateEventPage({
    mode: "edit",
  });

  return (
    <AppLayout>
      <section className={styles["create-event-page"]}>
        <CreateEventFormView viewModel={viewModel} />
      </section>
    </AppLayout>
  );
}

export default UpdateEventPage;
