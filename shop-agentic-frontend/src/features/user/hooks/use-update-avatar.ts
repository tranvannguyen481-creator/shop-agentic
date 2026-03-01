import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  CURRENT_USER_QUERY_KEY,
  useCurrentUserQuery,
} from "../../../shared/hooks/use-current-user-query";
import {
  updateUserProfile,
  uploadAvatar,
} from "../../../shared/services/auth-api";
import type { AuthUser } from "../../auth/types/auth-user";

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUserQuery();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploadError(null);
    setIsUploading(true);

    try {
      const photoURL = await uploadAvatar(file);
      const updatedUser = await updateUserProfile({ photoURL });

      queryClient.setQueryData<AuthUser>(
        [...CURRENT_USER_QUERY_KEY],
        updatedUser,
      );

      setPreviewUrl(null);
    } catch {
      setPreviewUrl(null);
      setUploadError("Failed to update avatar. Please try again.");
    } finally {
      URL.revokeObjectURL(localPreview);
      setIsUploading(false);
    }
  };

  const avatarSrc =
    previewUrl ??
    (typeof currentUser?.photoURL === "string" && currentUser.photoURL
      ? currentUser.photoURL
      : undefined);

  return {
    fileInputRef,
    isUploading,
    uploadError,
    avatarSrc,
    triggerFileInput,
    handleFileChange,
  };
}
