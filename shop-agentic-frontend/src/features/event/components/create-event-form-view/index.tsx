import { APP_PATHS } from "../../../../app/route-config";
import {
  Form,
  FormCheckbox,
  FormDateTimePicker,
  FormInput,
  FormSelect,
  FormTextarea,
  FormUploadField,
} from "../../../../shared/components/form";
import {
  DeliveryOptionsModal,
  ExternalUrlModal,
  ImportantNotesModal,
  SectionCard,
} from "../../../../shared/components/ui";
import styles from "../../pages/create-event-page/index.module.scss";
import { CreateEventPageViewModel } from "../../types/create-event-page-types";
import { CreateEventFormValues } from "../../types/create-event-types";
import EventStepNavigation from "../event-step-navigation";

interface CreateEventFormViewProps {
  viewModel: CreateEventPageViewModel;
}

function CreateEventFormView({ viewModel }: CreateEventFormViewProps) {
  return (
    <>
      <Form
        form={viewModel.form}
        onSubmit={viewModel.handleSubmit}
        className={styles.form}
      >
        <FormSelect<CreateEventFormValues>
          name="groupId"
          label="Group"
          options={viewModel.groupOptions}
          wrapperClassName={styles["mode-label"]}
          aria-label="Group"
        />

        <div className={styles["upload-row"]}>
          <FormUploadField<CreateEventFormValues>
            name="uploadExcel"
            label="Upload template (.csv)"
            accept=".csv,text/csv"
            layout="inline"
            triggerText="Choose file"
            showFileName
            onFilesChange={viewModel.handleTemplateUpload}
            wrapperClassName={styles["upload-field"]}
          />
          <button
            type="button"
            className={styles["template-link"]}
            onClick={viewModel.handleDownloadTemplate}
          >
            Download template
          </button>
          {viewModel.templateMessage ? (
            <p className={styles["template-message"]}>
              {viewModel.templateMessage}
            </p>
          ) : null}
        </div>

        <FormInput<CreateEventFormValues> name="title" label="Title" />

        <FormTextarea<CreateEventFormValues>
          name="description"
          label="Description"
          rows={3}
        />

        <FormInput<CreateEventFormValues>
          name="pickupLocation"
          label="Pick-up Location"
        />

        <div className={styles["field-row"]}>
          <FormDateTimePicker<CreateEventFormValues>
            name="closingDate"
            label="Closing Date"
            type="date"
          />

          <FormDateTimePicker<CreateEventFormValues>
            name="collectionDate"
            label="Collection Date"
            type="date"
          />
        </div>

        <FormDateTimePicker<CreateEventFormValues>
          name="collectionTime"
          label="Collection Time"
          type="time"
          wrapperClassName={styles["time-field"]}
        />

        <h3 className={styles["section-title"]}>Payment Options</h3>

        <SectionCard>
          <FormCheckbox<CreateEventFormValues>
            name="paymentAfterClosing"
            label="Payment to be made after closing date"
            description="This option calls for buyers to pay later. This option allow host to distribute the cost of delivery cost and consolidate discount at the end of the event."
          />
        </SectionCard>

        <SectionCard>
          <FormCheckbox<CreateEventFormValues>
            name="payTogether"
            label="Pay together"
            description="This option allows buyers to pay for multiple events enabled with Pay together."
          />
        </SectionCard>

        <SectionCard className={styles["fee-card"]}>
          <span>Admin fees to be added to each order</span>
          <div className={styles["fee-input"]}>
            <span>$</span>
            <FormInput<CreateEventFormValues>
              name="adminFee"
              type="number"
              step="0.1"
              wrapperClassName={styles["fee-value"]}
            />
          </div>
        </SectionCard>

        <SectionCard>
          <FormCheckbox<CreateEventFormValues>
            name="addImportantNotes"
            label="Add important notes to buyers"
            wrapperClassName={styles["single-check"]}
            onChange={(event) =>
              viewModel.handleImportantNotesToggle(event.currentTarget.checked)
            }
          />
        </SectionCard>

        <SectionCard>
          <FormCheckbox<CreateEventFormValues>
            name="addExternalUrl"
            label="Add external URL"
            wrapperClassName={styles["single-check"]}
            onChange={(event) =>
              viewModel.handleExternalUrlToggle(event.currentTarget.checked)
            }
          />
        </SectionCard>

        <SectionCard>
          <FormCheckbox<CreateEventFormValues>
            name="addDeliveryOptions"
            label="Add Delivery Options"
            wrapperClassName={styles["single-check"]}
            onChange={(event) =>
              viewModel.handleDeliveryOptionsToggle(event.currentTarget.checked)
            }
          />
        </SectionCard>

        <SectionCard>
          <FormCheckbox<CreateEventFormValues>
            name="requestDeliveryDetails"
            label="Request for Delivery Details"
            wrapperClassName={styles["single-check"]}
          />
        </SectionCard>

        <EventStepNavigation
          currentPath={APP_PATHS.createEvent}
          nextType="submit"
          className={styles.actions}
        />
      </Form>

      <ImportantNotesModal
        open={viewModel.isImportantNotesModalOpen}
        initialNotes={viewModel.importantNotes}
        onCancel={viewModel.handleCancelImportantNotes}
        onSave={viewModel.handleSaveImportantNotes}
      />

      <ExternalUrlModal
        open={viewModel.isExternalUrlModalOpen}
        initialFieldName={viewModel.externalUrlFieldName}
        initialUrl={viewModel.externalUrl}
        onCancel={viewModel.handleCancelExternalUrl}
        onSave={viewModel.handleSaveExternalUrl}
      />

      <DeliveryOptionsModal
        open={viewModel.isDeliveryOptionsModalOpen}
        initialDate={viewModel.deliveryScheduleDate}
        initialFromTime={viewModel.deliveryTimeFrom}
        initialToTime={viewModel.deliveryTimeTo}
        initialFees={viewModel.deliveryFees}
        onCancel={viewModel.handleCancelDeliveryOptions}
        onSave={viewModel.handleSaveDeliveryOptions}
      />
    </>
  );
}

export default CreateEventFormView;
