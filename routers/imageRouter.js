const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");

// 특정 게시글에 연결된 이미지 목록 조회
router.get("/by-post/:postId", imageController.getImagesByPostId);

module.exports = router;
