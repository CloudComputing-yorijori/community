const express = require("express");
const router = express.Router();

const apiController = require("../controllers/apiController");

router.get("/posts/:userId", apiController.getPostsByUserId);
router.get("/saves/:userId", apiController.getSavedPostsByUserId);
router.get("/comments/:userId", apiController.getCommentsByUserId);

module.exports = router;
