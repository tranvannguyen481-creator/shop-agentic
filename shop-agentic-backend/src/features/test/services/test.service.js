const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const SAMPLE_IMAGES = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: `Sample Image ${i + 1}`,
  url: `${BASE_URL}/images/sample-${i + 1}.svg`,
  width: 800,
  height: 600,
}));

const getImages = async ({ page = 1, limit = 4 } = {}) => {
  const offset = (page - 1) * limit;
  const items = SAMPLE_IMAGES.slice(offset, offset + limit);

  return {
    items,
    total: SAMPLE_IMAGES.length,
    page,
    limit,
    totalPages: Math.ceil(SAMPLE_IMAGES.length / limit),
  };
};

module.exports = { getImages };
