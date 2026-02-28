import { ChevronLeft, Crown, Monitor } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Button,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import { useGroupDetailPage } from "../../hooks/use-group-detail-page";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.groupDetail;

function GroupDetailPage() {
  const viewModel = useGroupDetailPage();

  return (
    <AppLayout>
      <section className={styles.page}>
        <div className={styles.content}>
          <header className={styles.header}>
            <h2>{viewModel.groupName}</h2>
            <p>
              {viewModel.canUsePremiumLayout
                ? "Premium member can switch dashboard mode"
                : "Standard member uses admin mobile layout"}
            </p>
          </header>

          <div className={styles.modeSwitch}>
            <Button
              type="button"
              variant={
                viewModel.mode === "admin-mobile" ? "primary" : "outline"
              }
              onClick={() => viewModel.onSelectMode("admin-mobile")}
            >
              <Monitor size={16} />
              Admin mobile
            </Button>
            <Button
              type="button"
              variant={viewModel.mode === "premium" ? "primary" : "outline"}
              onClick={() => viewModel.onSelectMode("premium")}
              disabled={!viewModel.canUsePremiumLayout}
            >
              <Crown size={16} />
              Premium
            </Button>
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
                    <h3>Group details</h3>
                    <p>{viewModel.description}</p>
                    <p>
                      <strong>Owner:</strong> {viewModel.ownerDisplayName}
                    </p>
                    <p>
                      <strong>Owner email:</strong> {viewModel.ownerEmail}
                    </p>
                    <p>
                      <strong>Created:</strong> {viewModel.createdAtText}
                    </p>
                    <p>
                      <strong>Updated:</strong> {viewModel.updatedAtText}
                    </p>
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
                    <h3>Premium dashboard</h3>
                    <p>
                      Subscription mode active for this group. You can switch
                      back to admin mobile layout anytime.
                    </p>
                    <p>
                      <strong>Group status:</strong> {viewModel.status}
                    </p>
                    <p>
                      <strong>Members:</strong> {viewModel.memberCount}
                    </p>
                    <p>
                      <strong>Invite code:</strong> {viewModel.inviteCode}
                    </p>
                  </SectionCard>
                </>
              )}
            </>
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
