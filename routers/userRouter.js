const express = require('express');
const router = express.Router();
const userApiController = require("../controllers/userApiController");
//userApi
router.get("/:userId/info",userApiController.getUserInfo);
router.get("/:userId/posts",userApiController.getMyPosts);
router.get("/:userId/comments",userApiController.getMyComments);
router.get("/:userId/saves", userApiController.getSavedPosts);

module.exports = router;
