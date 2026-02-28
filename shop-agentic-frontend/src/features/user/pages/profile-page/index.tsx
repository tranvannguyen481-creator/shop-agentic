import {
  Bell,
  Camera,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageSquare,
  Save,
  SquarePen,
  X,
} from "lucide-react";
import { useState } from "react";
import { APP_PATHS } from "../../../../app/route-config";
import { Form, FormInput } from "../../../../shared/components/form";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Modal,
  SectionCard,
  Spinner,
} from "../../../../shared/components/ui";
import { useCurrentUserQuery } from "../../../../shared/hooks/use-current-user-query";
import AppLayout from "../../../../shared/layouts/app-layout";
import { useSignOutSubmit } from "../../../auth/hooks/use-sign-out-submit";
import { useUpdateAvatar } from "../../hooks/use-update-avatar";
import {
  useUpdateProfileForm,
  type UpdateProfileFormValues,
} from "../../hooks/use-update-profile-form";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.userProfile;

function ProfilePage() {
  const { onSignOut, isSubmitting } = useSignOutSubmit();
  const { data: currentUser } = useCurrentUserQuery();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    form,
    onSubmit,
    isSubmitting: isSaving,
    submitError,
  } = useUpdateProfileForm(() => setIsEditModalOpen(false));

  const {
    fileInputRef,
    isUploading,
    uploadError: avatarError,
    avatarSrc,
    triggerFileInput,
    handleFileChange,
  } = useUpdateAvatar();

  const displayName =
    typeof currentUser?.displayName === "string" && currentUser.displayName
      ? currentUser.displayName
      : "User";

  const createdAt =
    typeof currentUser?.createdAt === "number" && currentUser.createdAt > 0
      ? new Date(currentUser.createdAt).getFullYear()
      : null;

  return (
    <AppLayout>
      <section className={styles.page}>
        <SectionCard className={styles.profileHeader}>
          <button
            type="button"
            className={styles.avatarWrapper}
            onClick={triggerFileInput}
            disabled={isUploading}
            aria-label="Change avatar"
          >
            {isUploading ? (
              <span className={styles.avatarSpinner}>
                <Spinner size={40} />
              </span>
            ) : (
              <>
                <Avatar
                  name={displayName}
                  src={avatarSrc}
                  size={88}
                  className={styles.avatar}
                />
                <span className={styles.avatarOverlay} aria-hidden="true">
                  <Camera size={20} strokeWidth={1.8} />
                </span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.avatarInput}
            onChange={handleFileChange}
            aria-hidden="true"
          />
          {avatarError ? (
            <Alert tone="error" className={styles.avatarError}>
              {avatarError}
            </Alert>
          ) : null}
          <h2 className={styles.name}>{displayName}</h2>
          {createdAt !== null && (
            <p className={styles.memberSince}>Member since {createdAt}</p>
          )}
        </SectionCard>

        <section className={styles.actionsGrid}>
          <Button type="button" variant="text" className={styles.actionItem}>
            <Bell className={styles.icon} aria-hidden="true" />
            <small>Notification</small>
          </Button>
          <Button
            type="button"
            variant="text"
            className={styles.actionItem}
            onClick={() => setIsEditModalOpen(true)}
          >
            <SquarePen className={styles.icon} aria-hidden="true" />
            <small>Edit Profile</small>
          </Button>
          <Button type="button" variant="text" className={styles.actionItem}>
            <LockKeyhole className={styles.icon} aria-hidden="true" />
            <small>PIN Update</small>
          </Button>
          <Button type="button" variant="text" className={styles.actionItem}>
            <MapPin className={styles.icon} aria-hidden="true" />
            <small>Manage Addresses</small>
          </Button>
        </section>

        <SectionCard className={styles.notificationCard}>
          <header className={styles.notificationHead}>
            <h3>Notification</h3>
          </header>

          <article className={styles.feedItem}>
            <p className={styles.meta}>17-10-2023 • System</p>
            <Badge className={styles.badge}>System</Badge>
            <p>
              Today&apos;s collection order ref: <strong>S-VN7VK5</strong>
            </p>
            <ul>
              <li>1 x Sample item 1</li>
              <li>1 x Sample item 2</li>
            </ul>
          </article>
        </SectionCard>

        <section className={styles.feedback}>
          <p>We appreciate your feedback! Drop us an email: </p>
          <a href="mailto:friends@shop-agentic.com">friends@shop-agentic.com</a>
        </section>

        <section className={styles.actionRow}>
          <Button type="button" className={styles.feedbackBtn} fullWidth>
            <MessageSquare size={16} />
            FEEDBACK
          </Button>
          <Button
            type="button"
            variant="outline"
            className={styles.logoutBtn}
            fullWidth
            onClick={onSignOut}
            disabled={isSubmitting}
          >
            <LogOut size={16} />
            {isSubmitting ? "Logging out..." : "Logout"}
          </Button>
        </section>
      </section>

      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <Form<UpdateProfileFormValues>
          form={form}
          onSubmit={onSubmit}
          className={styles.editForm}
        >
          <FormInput<UpdateProfileFormValues>
            name="displayName"
            label="Display Name"
            placeholder="Display Name"
          />
          <FormInput<UpdateProfileFormValues>
            name="mobileNumber"
            label="Mobile Number"
            type="tel"
            placeholder="Mobile Number"
          />
          <FormInput<UpdateProfileFormValues>
            name="postalCode"
            label="Postal Code"
            placeholder="Postal Code"
          />
          {submitError ? (
            <Alert tone="error" className={styles.modalError}>
              {submitError}
            </Alert>
          ) : null}
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              <X size={16} />
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <span className={styles.buttonLoading}>
                  <Spinner size={16} />
                  Saving...
                </span>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal>
    </AppLayout>
  );
}

export default ProfilePage;
