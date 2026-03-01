import { ChevronLeft, Crown, Monitor } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Button,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import { useCurrentUserQuery } from "../../../../shared/hooks/use-current-user-query";
import AppLayout from "../../../../shared/layouts/app-layout";
import JoinRequestsSection from "../../components/join-requests-section";
import { useGroupDetailPage } from "../../hooks/use-group-detail-page";
import { useJoinRequests } from "../../hooks/use-join-requests";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.groupDetail;

function GroupDetailPage() {
  const viewModel = useGroupDetailPage();
  const { data: currentUser } = useCurrentUserQuery();

  const currentUid = currentUser?.uid ?? currentUser?.id;
  const isOwner =
    !!currentUid && !!viewModel.ownerUid && currentUid === viewModel.ownerUid;

  const joinRequests = useJoinRequests(viewModel.groupId, isOwner);

  return (
    <AppLayout>
      <section className={styles.page}>
        <div className={styles.content}>
          {/* Hero banner */}
          <div className={styles.hero}>
            <span className={styles.heroInitial}>
              {String(viewModel.groupName ?? "G")
                .charAt(0)
                .toUpperCase()}
            </span>
            <div className={styles.heroInfo}>
              <h2 className={styles.heroTitle}>
                {viewModel.groupName || "Group"}
              </h2>
              <p className={styles.heroSub}>
                {viewModel.canUsePremiumLayout
                  ? "Premium · Switch dashboard mode below"
                  : "Standard · Admin mobile layout"}
              </p>
            </div>
          </div>

          {/* Mode segmented switch */}
          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={[
                styles.modeBtn,
                viewModel.mode === "admin-mobile" ? styles.modeBtnActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => viewModel.onSelectMode("admin-mobile")}
            >
              <Monitor size={14} />
              Admin mobile
            </button>
            <button
              type="button"
              className={[
                styles.modeBtn,
                viewModel.mode === "premium" ? styles.modeBtnActive : "",
                !viewModel.canUsePremiumLayout ? styles.modeBtnDisabled : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() =>
                viewModel.canUsePremiumLayout &&
                viewModel.onSelectMode("premium")
              }
              disabled={!viewModel.canUsePremiumLayout}
            >
              <Crown size={14} />
              Premium
            </button>
          </div>

          {!viewModel.canUsePremiumLayout ? (
            <Alert tone="info">
              Premium layout is locked. Upgrade subscription to unlock premium
              dashboard mode.
            </Alert>
          ) : null}

          {viewModel.error ? (
            <Alert tone="error">{viewModel.error}</Alert>
          ) : null}
          {viewModel.isLoading ? (
            <>
              <div className={styles.loadingCards}>
                <SectionCard className={styles.loadingCard}>
                  <Skeleton height={24} width="56%" />
                  <Skeleton height={14} width="70%" />
                </SectionCard>
                <SectionCard className={styles.loadingCard}>
                  <Skeleton height={24} width="48%" />
                  <Skeleton height={14} width="74%" />
                </SectionCard>
                <SectionCard className={styles.loadingCard}>
                  <Skeleton height={24} width="52%" />
                  <Skeleton height={14} width="68%" />
                </SectionCard>
              </div>
              <SectionCard className={styles.loadingDetails}>
                <Skeleton height={20} width="42%" />
                <Skeleton height={14} width="100%" />
                <Skeleton height={14} width="90%" />
                <Skeleton height={14} width="82%" />
                <Skeleton height={14} width="78%" />
              </SectionCard>
            </>
          ) : null}

          {!viewModel.isLoading ? (
            <>
              {!viewModel.isPremiumMode ? (
                <>
                  <div className={styles.cards}>
                    {viewModel.dashboardCards.map((card) => (
                      <SectionCard key={card.label} className={styles.card}>
                        <strong>{card.value}</strong>
                        <span>{card.label}</span>
                      </SectionCard>
                    ))}
                  </div>

                  <SectionCard className={styles.details}>
                    <h3 className={styles.detailsTitle}>Group details</h3>
                    {viewModel.description ? (
                      <p className={styles.detailsDesc}>
                        {viewModel.description}
                      </p>
                    ) : null}
                    <dl className={styles.detailsGrid}>
                      <dt>Owner</dt>
                      <dd>{viewModel.ownerDisplayName}</dd>
                      <dt>Email</dt>
                      <dd>{viewModel.ownerEmail}</dd>
                      <dt>Created</dt>
                      <dd>{viewModel.createdAtText}</dd>
                      <dt>Updated</dt>
                      <dd>{viewModel.updatedAtText}</dd>
                    </dl>
                  </SectionCard>
                </>
              ) : (
                <>
                  <div className={styles.cards}>
                    {viewModel.premiumCards.map((card) => (
                      <SectionCard key={card.label} className={styles.card}>
                        <strong>{card.value}</strong>
                        <span>{card.label}</span>
                      </SectionCard>
                    ))}
                  </div>

                  <SectionCard className={styles.details}>
                    <h3 className={styles.detailsTitle}>Premium dashboard</h3>
                    <p className={styles.detailsDesc}>
                      Subscription mode active. Switch back to admin mobile
                      anytime.
                    </p>
                    <dl className={styles.detailsGrid}>
                      <dt>Status</dt>
                      <dd>{viewModel.status}</dd>
                      <dt>Members</dt>
                      <dd>{viewModel.memberCount}</dd>
                      <dt>Invite code</dt>
                      <dd>{viewModel.inviteCode}</dd>
                    </dl>
                  </SectionCard>
                </>
              )}
            </>
          ) : null}

          {!viewModel.isLoading && isOwner ? (
            <JoinRequestsSection
              items={joinRequests.items}
              isLoading={joinRequests.isLoading}
              error={joinRequests.error}
              approvingId={joinRequests.approvingId}
              rejectingId={joinRequests.rejectingId}
              onApprove={joinRequests.onApprove}
              onReject={joinRequests.onReject}
            />
          ) : null}

          <Button
            type="button"
            variant="secondary"
            onClick={viewModel.onBackToGroups}
          >
            <ChevronLeft size={16} />
            Back to my groups
          </Button>
        </div>
      </section>
    </AppLayout>
  );
}

export default GroupDetailPage;
