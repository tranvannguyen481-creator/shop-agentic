import {
  Link2,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Share2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import SearchBar from "../../../../shared/components/search-bar";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  SectionCard,
  Select,
  Skeleton,
  Textarea,
  Toast,
} from "../../../../shared/components/ui";
import { ListMyGroupsPageViewModel } from "../../types/list-my-groups-types";
import styles from "./index.module.scss";

interface ListMyGroupsViewProps {
  viewModel: ListMyGroupsPageViewModel;
}

function ListMyGroupsView({ viewModel }: ListMyGroupsViewProps) {
  return (
    <section className={styles.page}>
      <div className={styles.headerActions}>
        <SearchBar
          value={viewModel.search}
          onValueChange={viewModel.onSearchChange}
          placeholder="Search by group code"
          ariaLabel="Search groups by code"
        />
        <Button type="button" onClick={viewModel.onOpenCreateModal}>
          <Plus size={16} />
          <span>Create Group</span>
        </Button>
      </div>

      {viewModel.feedbackMessage ? (
        <Alert tone={viewModel.feedbackTone}>{viewModel.feedbackMessage}</Alert>
      ) : null}

      {viewModel.error ? <Alert tone="error">{viewModel.error}</Alert> : null}

      {viewModel.isLoading ? (
        <div className={styles.loadingBlock}>
          <SectionCard className={styles.loadingCard}>
            <Skeleton height={20} width="44%" />
            <Skeleton height={16} width="92%" />
            <Skeleton height={16} width="70%" />
            <div className={styles.loadingActions}>
              <Skeleton height={34} />
              <Skeleton height={34} />
              <Skeleton height={34} />
            </div>
          </SectionCard>
          <SectionCard className={styles.loadingCard}>
            <Skeleton height={20} width="38%" />
            <Skeleton height={16} width="88%" />
            <Skeleton height={16} width="64%" />
            <div className={styles.loadingActions}>
              <Skeleton height={34} />
              <Skeleton height={34} />
              <Skeleton height={34} />
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!viewModel.isLoading && viewModel.groups.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<Users />}
            title="No groups found"
            description="Try a different keyword or create a new group to start inviting members."
            actions={
              <Button type="button" onClick={viewModel.onOpenCreateModal}>
                <Plus size={16} />
                Create group
              </Button>
            }
          />
        </SectionCard>
      ) : null}

      {!viewModel.isLoading && viewModel.groups.length > 0 ? (
        <div className={styles.groupList}>
          {viewModel.groups.map((group) => (
            <SectionCard
              key={group.id}
              className={styles.groupCard}
              role="button"
              tabIndex={0}
              onClick={() => viewModel.onOpenGroupDetail(group.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  viewModel.onOpenGroupDetail(group.id);
                }
              }}
            >
              <div className={styles.cardTop}>
                <span className={styles.groupAvatar}>
                  {String(group.name ?? "")
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <div className={styles.groupInfo}>
                  <div className={styles.groupHeader}>
                    <h3 className={styles.groupTitle}>{group.name}</h3>
                    <div className={styles.badges}>
                      <Badge
                        tone={group.status === "active" ? "success" : "warning"}
                      >
                        {group.status}
                      </Badge>
                      <Badge
                        tone={group.role === "owner" ? "default" : "warning"}
                      >
                        {group.role}
                      </Badge>
                    </div>
                  </div>

                  <p className={styles.groupDesc}>{group.description}</p>

                  <div className={styles.groupMeta}>
                    <Users size={11} />
                    <span>{group.memberCount} members</span>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="outline"
                  className={styles["action-btn"]}
                  onClick={(event) => {
                    event.stopPropagation();
                    viewModel.onOpenSettingsModal(group.id);
                  }}
                >
                  <Settings size={13} />
                  <span>Settings</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className={styles["action-btn"]}
                  onClick={(event) => {
                    event.stopPropagation();
                    viewModel.onOpenAddMemberModal(group.id);
                  }}
                >
                  <UserPlus size={13} />
                  <span>Add</span>
                </Button>
                <Button
                  type="button"
                  className={styles["action-btn"]}
                  onClick={(event) => {
                    event.stopPropagation();
                    viewModel.onOpenShareLinkModal(group.id);
                  }}
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </Button>
              </div>
            </SectionCard>
          ))}
        </div>
      ) : null}

      <Modal
        open={viewModel.isCreateModalOpen}
        onClose={viewModel.onCloseModal}
        title="Create group"
        footer={
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="outline"
              onClick={viewModel.onResetGroupCode}
            >
              <RotateCcw size={16} /> Reset code
            </Button>
            <Button
              type="button"
              variant="text"
              onClick={viewModel.onCloseModal}
            >
              <X size={16} /> Cancel
            </Button>
            <Button type="button" onClick={viewModel.onCreateGroup}>
              <Plus size={16} /> Create
            </Button>
          </div>
        }
      >
        <div className={styles.modalBody}>
          <Input
            label="Group name"
            value={viewModel.createGroupName}
            onChange={(event) =>
              viewModel.onCreateGroupNameChange(event.currentTarget.value)
            }
            placeholder="Enter group name"
          />
          <Textarea
            label="Description"
            value={viewModel.createGroupDescription}
            onChange={(event) =>
              viewModel.onCreateGroupDescriptionChange(
                event.currentTarget.value,
              )
            }
            placeholder="Describe your group"
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={viewModel.isSettingsModalOpen}
        onClose={viewModel.onCloseModal}
        title="Setting group"
        footer={
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="text"
              onClick={viewModel.onCloseModal}
            >
              <X size={16} /> Cancel
            </Button>
            <Button type="button" onClick={viewModel.onSaveSettings}>
              <Save size={16} /> Save settings
            </Button>
          </div>
        }
      >
        <div className={styles.modalBody}>
          <Input
            label="Group"
            value={viewModel.selectedGroup?.name ?? ""}
            readOnly
          />
          <Select
            label="Status"
            value={viewModel.statusDraft}
            onChange={(event) =>
              viewModel.onStatusDraftChange(
                event.currentTarget.value as "active" | "paused",
              )
            }
            options={viewModel.statusOptions}
          />
        </div>
      </Modal>

      <Modal
        open={viewModel.isAddMemberModalOpen}
        onClose={viewModel.onCloseModal}
        title="Add member"
        footer={
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="text"
              onClick={viewModel.onCloseModal}
            >
              <X size={16} /> Cancel
            </Button>
            <Button type="button" onClick={viewModel.onAddMember}>
              <UserPlus size={16} /> Send invite
            </Button>
          </div>
        }
      >
        <div className={styles.modalBody}>
          <Input
            label="Group"
            value={viewModel.selectedGroup?.name ?? ""}
            readOnly
          />
          <Input
            label="Member email"
            value={viewModel.memberEmail}
            onChange={(event) =>
              viewModel.onMemberEmailChange(event.currentTarget.value)
            }
            placeholder="example@email.com"
          />
        </div>
      </Modal>

      <Modal
        open={viewModel.isShareLinkModalOpen}
        onClose={viewModel.onCloseModal}
        title="Share link group"
        footer={
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="text"
              onClick={viewModel.onCloseModal}
            >
              <X size={16} /> Close
            </Button>
            <Button type="button" onClick={viewModel.onCopyShareLink}>
              <Link2 size={16} /> Copy link
            </Button>
          </div>
        }
      >
        <div className={styles.modalBody}>
          <Input
            label="Invite link"
            value={viewModel.selectedGroupShareLink}
            readOnly
          />
        </div>
      </Modal>

      {viewModel.toastMessage ? (
        <div className={styles.toastWrap}>
          <Toast
            message={viewModel.toastMessage}
            action={
              <Button
                type="button"
                variant="text"
                onClick={viewModel.onToastDismiss}
              >
                <X size={16} /> Close
              </Button>
            }
          />
        </div>
      ) : null}
    </section>
  );
}

export default ListMyGroupsView;
