import { Bell, LockKeyhole, MapPin, SquarePen } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Avatar,
  Badge,
  Button,
  SectionCard,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import { useSignOutSubmit } from "../../../auth/hooks/use-sign-out-submit";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.userProfile;

function ProfilePage() {
  const { onSignOut, isSubmitting } = useSignOutSubmit();

  return (
    <AppLayout>
      <section className={styles.page}>
        <SectionCard className={styles.profileHeader}>
          <Avatar
            name="Trương Thành Trung"
            size={88}
            className={styles.avatar}
          />
          <h2 className={styles.name}>Trương Thành Trung</h2>
          <p className={styles.memberSince}>Member since 2023</p>
        </SectionCard>

        <section className={styles.actionsGrid}>
          <Button type="button" variant="text" className={styles.actionItem}>
            <Bell className={styles.icon} aria-hidden="true" />
            <small>Notification</small>
          </Button>
          <Button type="button" variant="text" className={styles.actionItem}>
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
            {isSubmitting ? "Logging out..." : "Logout"}
          </Button>
        </section>
      </section>
    </AppLayout>
  );
}

export default ProfilePage;
