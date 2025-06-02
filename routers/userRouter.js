const express = require('express');
const router = express.Router();
const userApiController = require("../controllers/userApiController");
//userApi
router.get("/user/:userId/Info",userApiController.getUserInfo);
router.get("/user/:userId/posts",userApiController.getMyPosts);
router.get("/user/:userId/comments",userApiController.getMyComments);
router.get("/user/:userId/saves", userApiController.getSavedPosts);

module.exports = router;
