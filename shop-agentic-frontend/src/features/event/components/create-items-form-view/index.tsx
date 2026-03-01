import {
  ChevronDown,
  ChevronUp,
  Copy,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Form,
  FormInput,
  FormTextarea,
} from "../../../../shared/components/form";
import {
  Button,
  SectionCard,
  UploadField,
  ZoomImage,
} from "../../../../shared/components/ui";
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
          <span className={styles["photo-limit"]}>
            Remain ({viewModel.bannerPhotosLeft} photos left)
          </span>
          <div className={styles["banner-media"]}>
            {viewModel.bannerPreviewUrls.length > 0 ? (
              <div className={styles["banner-gallery"]}>
                {viewModel.bannerPreviewUrls.map((previewUrl, index) => (
                  <article
                    className={styles["banner-preview"]}
                    key={previewUrl}
                  >
                    <ZoomImage
                      src={previewUrl}
                      alt={`Banner preview ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="text"
                      className={styles["remove-banner-photo"]}
                      aria-label={`Remove banner image ${index + 1}`}
                      onClick={() =>
                        viewModel.handleRemoveBannerPhoto(previewUrl)
                      }
                    >
                      <Trash2 size={14} strokeWidth={2.2} />
                      <span>Remove</span>
                    </Button>
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
            const itemOptionGroups = viewModel.getItemOptionGroups(itemIndex);

            return (
              <SectionCard className={styles["item-card"]} key={itemField.id}>
                <div className={styles["item-image-row"]}>
                  <p className={styles["item-label"]}>Item Image</p>
                  <div className={styles["item-media"]}>
                    {itemPreviewUrl ? (
                      <>
                        <div className={styles["item-preview-slot"]}>
                          <div className={styles["item-preview"]}>
                            <ZoomImage
                              src={itemPreviewUrl}
                              alt={`Item preview ${itemIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant="text"
                              className={styles["remove-item-photo"]}
                              aria-label={`Remove item image ${itemIndex + 1}`}
                              onClick={() =>
                                viewModel.handleRemoveItemPhoto(itemIndex)
                              }
                            >
                              <Trash2 size={14} strokeWidth={2.2} />
                              <span className="visually-hidden">Remove</span>
                            </Button>
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
                    <Button
                      type="button"
                      variant="text"
                      iconOnly
                      aria-label={`Move item ${itemIndex + 1} up`}
                      onClick={() => viewModel.handleSwapItemUp(itemIndex)}
                      disabled={itemIndex === 0}
                    >
                      <ChevronUp size={18} strokeWidth={2.2} />
                      <span className="visually-hidden">Up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      iconOnly
                      aria-label={`Move item ${itemIndex + 1} down`}
                      onClick={() => viewModel.handleSwapItemDown(itemIndex)}
                      disabled={itemIndex === viewModel.itemFields.length - 1}
                    >
                      <ChevronDown size={18} strokeWidth={2.2} />
                      <span className="visually-hidden">Down</span>
                    </Button>
                  </div>
                </div>

                <div className={styles["price-row"]}>
                  <FormInput<CreateItemsFormValues>
                    label="Price ($)"
                    name={`items.${itemIndex}.price` as const}
                  />
                  <div className={styles["item-actions"]}>
                    <Button
                      type="button"
                      variant="text"
                      iconOnly
                      aria-label={`Duplicate item ${itemIndex + 1}`}
                      onClick={() => viewModel.handleDuplicateItem(itemIndex)}
                    >
                      <Copy size={16} strokeWidth={2.2} />
                      <span className="visually-hidden">Copy</span>
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      iconOnly
                      aria-label={`Delete item ${itemIndex + 1}`}
                      onClick={() => viewModel.handleRemoveItem(itemIndex)}
                      disabled={viewModel.itemFields.length === 1}
                    >
                      <Trash2 size={16} strokeWidth={2.2} />
                      <span className="visually-hidden">Delete</span>
                    </Button>
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
                        <Button
                          type="button"
                          variant="text"
                          iconOnly
                          className={styles["remove-option"]}
                          aria-label={`Remove option ${optionIndex + 1}`}
                          onClick={() =>
                            viewModel.handleRemoveOption(itemIndex, optionIndex)
                          }
                        >
                          <Trash2 size={14} strokeWidth={2.2} />
                          <span className="visually-hidden">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {itemOptionGroups.length > 0 ? (
                  <div className={styles["option-groups"]}>
                    {itemOptionGroups.map((group, groupIndex) => (
                      <div
                        className={styles["option-group"]}
                        key={`${itemField.id}-group-${groupIndex}`}
                      >
                        <div className={styles["option-group-header"]}>
                          <span className={styles["option-group-title"]}>
                            {group.name}
                          </span>
                          {group.required ? (
                            <span className={styles["option-required-badge"]}>
                              Required
                            </span>
                          ) : null}
                          <Button
                            type="button"
                            variant="text"
                            iconOnly
                            className={styles["remove-option-group"]}
                            aria-label={`Remove option group ${group.name}`}
                            onClick={() =>
                              viewModel.handleRemoveOptionGroup(
                                itemIndex,
                                groupIndex,
                              )
                            }
                          >
                            <Trash2 size={14} strokeWidth={2.2} />
                            <span className="visually-hidden">Remove</span>
                          </Button>
                        </div>
                        <div className={styles["option-group-choices"]}>
                          {group.choices.map((choice, choiceIndex) => (
                            <span
                              className={styles["option-group-choice"]}
                              key={`${itemField.id}-group-${groupIndex}-choice-${choiceIndex}`}
                            >
                              <span className={styles["choice-name"]}>
                                {choice.name}
                              </span>
                              {typeof choice.price === "number" &&
                              choice.price > 0 ? (
                                <span className={styles["choice-price"]}>
                                  +${choice.price.toFixed(2)}
                                </span>
                              ) : null}
                              <Button
                                type="button"
                                variant="text"
                                iconOnly
                                className={styles["remove-choice"]}
                                aria-label={`Remove choice ${choice.name}`}
                                onClick={() =>
                                  viewModel.handleRemoveGroupChoice(
                                    itemIndex,
                                    groupIndex,
                                    choiceIndex,
                                  )
                                }
                              >
                                <Trash2 size={11} strokeWidth={2.2} />
                                <span className="visually-hidden">Remove</span>
                              </Button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="text"
                  className={styles["add-options"]}
                  onClick={() => viewModel.handleAddOption(itemIndex)}
                >
                  <Plus size={16} />
                  Add Options
                </Button>

                <Button
                  type="button"
                  variant="text"
                  className={styles["remove-item"]}
                  onClick={() => viewModel.handleRemoveItem(itemIndex)}
                  disabled={viewModel.itemFields.length === 1}
                >
                  <Trash2 size={14} />
                  Remove Item
                </Button>
              </SectionCard>
            );
          })}
        </div>

        <Button
          type="button"
          variant="text"
          className={styles["add-items"]}
          onClick={viewModel.handleAddItem}
        >
          <ImagePlus size={18} strokeWidth={2.1} />
          Add Items
        </Button>

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
