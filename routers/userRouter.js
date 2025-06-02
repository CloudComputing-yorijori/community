const express = require('express');
const router = express.Router();
const userApiController = require("../controllers/userApiController");
const userController = require("../controllers/userController");
//userApi
router.get("/user/:userId/Info",userApiController.getUserInfo);
//user
router.get("/user/:userId/posts",userController.getMyPosts);
router.get("/user/:userId/comments",userController.getMyComments);
router.get("/user/:userId/saves", userController.getSavedPosts);

module.exports = router;
