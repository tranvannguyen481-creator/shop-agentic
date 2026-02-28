import api from "../../../shared/services/api";

export interface TestImage {
  id: number;
  title: string;
  url: string;
  width: number;
  height: number;
}

export interface GetImagesResponse {
  items: TestImage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchTestImages = async (
  page: number,
  limit = 4,
): Promise<GetImagesResponse> => {
  const response = await api.get<{ success: boolean; data: GetImagesResponse }>(
    "/test/images",
    { params: { page, limit } },
  );
  return response.data.data;
};
