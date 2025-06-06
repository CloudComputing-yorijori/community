const express = require("express");
const router = express.Router();

const apiController = require("../controllers/apiController");

router.get("/posts/:userId", apiController.getPostsByUserId);
router.get("/saves/:userId", apiController.getSavedPostsByUserId);
router.get("/comments/:userId", apiController.getCommentsByUserId);
router.get("/search-posts/:userId", apiController.searchPosts);

module.exports = router;
