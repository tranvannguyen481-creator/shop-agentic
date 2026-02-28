import { Users } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Button,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import CreateEventFormView from "../../components/create-event-form-view";
import { useCreateEventPage } from "../../hooks/use-create-event-page";
import { useEventWizardSync } from "../../hooks/use-event-wizard-sync";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.createEvent;

function CreateEventPage() {
  useEventWizardSync({
    currentStepPath: APP_PATHS.createEvent,
    mode: "create",
    resourceId: "",
  });

  const viewModel = useCreateEventPage();

  return (
    <AppLayout>
      <section className={styles["create-event-page"]}>
        {viewModel.groupGateError ? (
          <Alert tone="error">{viewModel.groupGateError}</Alert>
        ) : null}

        {viewModel.isGroupGateLoading ? (
          <SectionCard className={styles["group-gate-loading"]}>
            <Skeleton height={20} width="56%" />
            <Skeleton height={14} width="100%" />
            <Skeleton height={14} width="92%" />
            <Skeleton height={38} width="100%" />
          </SectionCard>
        ) : null}

        {viewModel.isGroupGateBlocking ? (
          <SectionCard className={styles["group-gate-blocking"]}>
            <h3>Create group required</h3>
            <p>
              You need at least one group before creating an event. Please
              create your group first.
            </p>
            <Button type="button" onClick={viewModel.onGoToCreateGroup}>
              <Users size={16} />
              Go to create group
            </Button>
          </SectionCard>
        ) : null}

        {!viewModel.isGroupGateLoading && !viewModel.isGroupGateBlocking ? (
          <CreateEventFormView viewModel={viewModel} />
        ) : null}
      </section>
    </AppLayout>
  );
}

export default CreateEventPage;
