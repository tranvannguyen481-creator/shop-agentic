const BASE_URL = process.env["BASE_URL"] ?? "http://localhost:5000";

interface SampleImage {
  id: number;
  title: string;
  url: string;
  width: number;
  height: number;
}

const SAMPLE_IMAGES: SampleImage[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: `Sample Image ${i + 1}`,
  url: `${BASE_URL}/images/sample-${i + 1}.svg`,
  width: 800,
  height: 600,
}));

export async function getImages({
  page = 1,
  limit = 4,
}: { page?: number; limit?: number } = {}): Promise<{
  items: SampleImage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const offset = (page - 1) * limit;
  const items = SAMPLE_IMAGES.slice(offset, offset + limit);

  return {
    items,
    total: SAMPLE_IMAGES.length,
    page,
    limit,
    totalPages: Math.ceil(SAMPLE_IMAGES.length / limit),
  };
}
