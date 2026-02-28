const { Router } = require("express");
const testController = require("../controllers/test.controller");

const router = Router();

// GET /api/test/images?page=1&limit=4
router.get("/images", testController.getImages);

module.exports = router;
