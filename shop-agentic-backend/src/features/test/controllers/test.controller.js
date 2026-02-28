const testService = require("../services/test.service");

const getImages = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 4));

  const data = await testService.getImages({ page, limit });

  res.json({
    success: true,
    data,
    message: "Images fetched successfully",
  });
};

module.exports = { getImages };
