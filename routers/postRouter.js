const express = require('express');
const router = express.Router();
db = require("../models/index");
const postController = require("../controllers/postController");
const postApiController = require('../controllers/postApiController');
//postApi
router.get('/:postId/author', postApiController.getPostUserInfo);

//postApi
router.get('/:postId/author', postApiController.getPostUserInfo);
router.get("/noLoginRecommend", postController.getNoLoginRecommendPosts);
router.get("/loginRecommend", postController.getLoginRecommendPosts);
router.get("/:category", postController.getPostsByCategory);
router.get("/:category/:subcategory", postController.getPostsBySubcategory);
router.post("/save", postController.postSave);
router.post("/unsave", postController.postUnsave);
router.post("/view", postController.incrementView);

module.exports = router;
