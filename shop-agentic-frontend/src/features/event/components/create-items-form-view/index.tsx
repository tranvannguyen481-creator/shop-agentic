import { ChevronDown, ChevronUp, Copy, ImagePlus, Trash2 } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Form,
  FormInput,
  FormTextarea,
} from "../../../../shared/components/form";
import { SectionCard, UploadField } from "../../../../shared/components/ui";
import styles from "../../pages/create-items-page/index.module.scss";
import {
  CreateItemsFormValues,
  CreateItemsPageViewModel,
} from "../../types/create-items-types";
import EventStepNavigation from "../event-step-navigation";

interface CreateItemsFormViewProps {
  viewModel: CreateItemsPageViewModel;
}

function CreateItemsFormView({ viewModel }: CreateItemsFormViewProps) {
  return (
    <Form form={viewModel.form} onSubmit={viewModel.handleSubmit}>
      <section className={styles["create-items-page"]}>
        <div className={styles.banner}>
          <p className={styles["section-name"]}>Banner</p>
          <button type="button" className={styles["photo-limit"]}>
            Remain ({viewModel.bannerPhotosLeft} photos left)
          </button>
          <div className={styles["banner-media"]}>
            {viewModel.bannerPreviewUrls.length > 0 ? (
              <div className={styles["banner-gallery"]}>
                {viewModel.bannerPreviewUrls.map((previewUrl, index) => (
                  <article
                    className={styles["banner-preview"]}
                    key={previewUrl}
                  >
                    <img src={previewUrl} alt={`Banner preview ${index + 1}`} />
                    <button
                      type="button"
                      className={styles["remove-banner-photo"]}
                      aria-label={`Remove banner image ${index + 1}`}
                      onClick={() =>
                        viewModel.handleRemoveBannerPhoto(previewUrl)
                      }
                    >
                      <Trash2 size={14} strokeWidth={2.2} />
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            <UploadField
              label=""
              accept="image/*"
              multiple
              disabled={viewModel.bannerPhotosLeft === 0}
              variant="image-drop"
              triggerText="Drop your image here, or"
              supportText="Supports: JPG, JPEG2000, PNG"
              onFilesChange={viewModel.handleBannerFilesChange}
              wrapperClassName={styles["banner-upload"]}
            />
          </div>
        </div>

        <p className={styles["section-name"]}>Items for Sales</p>

        <div className={styles["items-list"]}>
          {viewModel.itemFields.map((itemField, itemIndex) => {
            const itemPreviewUrl = viewModel.getItemPreviewUrl(itemIndex);
            const itemOptions = viewModel.getItemOptions(itemIndex);

            return (
              <SectionCard className={styles["item-card"]} key={itemField.id}>
                <div className={styles["item-image-row"]}>
                  <p className={styles["item-label"]}>Item Image</p>
                  <div className={styles["item-media"]}>
                    {itemPreviewUrl ? (
                      <>
                        <div className={styles["item-preview-slot"]}>
                          <div className={styles["item-preview"]}>
                            <img
                              src={itemPreviewUrl}
                              alt={`Item preview ${itemIndex + 1}`}
                            />
                            <button
                              type="button"
                              className={styles["remove-item-photo"]}
                              aria-label={`Remove item image ${itemIndex + 1}`}
                              onClick={() =>
                                viewModel.handleRemoveItemPhoto(itemIndex)
                              }
                            >
                              <Trash2 size={14} strokeWidth={2.2} />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={styles["item-preview-slot"]}>
                        <UploadField
                          label=""
                          accept="image/*"
                          multiple={false}
                          variant="image-drop"
                          layout="stacked"
                          triggerClassName={styles["item-upload-trigger"]}
                          triggerText="Drop your image here, or"
                          supportText="Supports: JPG, JPEG2000, PNG"
                          onFilesChange={(files) =>
                            viewModel.handleItemFilesChange(itemIndex, files)
                          }
                          wrapperClassName={`${styles["item-upload"]} ${styles["item-upload-in-slot"]}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <FormInput<CreateItemsFormValues>
                  label="Item name"
                  requiredMark
                  name={`items.${itemIndex}.name` as const}
                />

                <div className={styles["description-row"]}>
                  <FormTextarea<CreateItemsFormValues>
                    label="Description"
                    rows={3}
                    name={`items.${itemIndex}.description` as const}
                  />
                  <div className={styles["description-actions"]}>
                    <button
                      type="button"
                      aria-label={`Move item ${itemIndex + 1} up`}
                      onClick={() => viewModel.handleSwapItemUp(itemIndex)}
                      disabled={itemIndex === 0}
                    >
                      <ChevronUp size={18} strokeWidth={2.2} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move item ${itemIndex + 1} down`}
                      onClick={() => viewModel.handleSwapItemDown(itemIndex)}
                      disabled={itemIndex === viewModel.itemFields.length - 1}
                    >
                      <ChevronDown size={18} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>

                <div className={styles["price-row"]}>
                  <FormInput<CreateItemsFormValues>
                    label="Price ($)"
                    name={`items.${itemIndex}.price` as const}
                  />
                  <div className={styles["item-actions"]}>
                    <button
                      type="button"
                      aria-label={`Duplicate item ${itemIndex + 1}`}
                      onClick={() => viewModel.handleDuplicateItem(itemIndex)}
                    >
                      <Copy size={16} strokeWidth={2.2} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete item ${itemIndex + 1}`}
                      onClick={() => viewModel.handleRemoveItem(itemIndex)}
                      disabled={viewModel.itemFields.length === 1}
                    >
                      <Trash2 size={16} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>

                {itemOptions.length > 0 ? (
                  <div className={styles["options-list"]}>
                    {itemOptions.map((option, optionIndex) => (
                      <div
                        className={styles["option-row"]}
                        key={`${itemField.id}-${optionIndex}-${option.value}`}
                      >
                        <FormInput<CreateItemsFormValues>
                          label={`Option ${optionIndex + 1}`}
                          name={
                            `items.${itemIndex}.options.${optionIndex}.value` as const
                          }
                        />
                        <button
                          type="button"
                          className={styles["remove-option"]}
                          aria-label={`Remove option ${optionIndex + 1}`}
                          onClick={() =>
                            viewModel.handleRemoveOption(itemIndex, optionIndex)
                          }
                        >
                          <Trash2 size={14} strokeWidth={2.2} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  className={styles["add-options"]}
                  onClick={() => viewModel.handleAddOption(itemIndex)}
                >
                  Add Options
                </button>

                <button
                  type="button"
                  className={styles["remove-item"]}
                  onClick={() => viewModel.handleRemoveItem(itemIndex)}
                  disabled={viewModel.itemFields.length === 1}
                >
                  Remove Item
                </button>
              </SectionCard>
            );
          })}
        </div>

        <button
          type="button"
          className={styles["add-items"]}
          onClick={viewModel.handleAddItem}
        >
          <ImagePlus size={18} strokeWidth={2.1} />
          Add Items
        </button>

        <EventStepNavigation
          currentPath={APP_PATHS.createEventItems}
          nextType="submit"
          className={styles.actions}
        />
      </section>
    </Form>
  );
}

export default CreateItemsFormView;
