const express = require('express');
const router = express.Router();
const writeController = require("../controllers/writeController");
const multer = require('multer');
const multerGoogleStorage = require('multer-google-storage');


//파일 업로드를 위한 multer 설정
const upload = multer({
    storage: multerGoogleStorage.storageEngine({
        bucket: 'yorizori_post_img',
        projectId: 'burnished-core-422015-g1',
        keyFilename: 'secure/burnished-core-422015-g1-f3b170868aa8.json',
        filename: (req, file, cb) => {
            cb(null, `yorizori_post_img/${file.originalname}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 파일 크기 제한 (예: 5MB)
});

router.get("/", writeController.getWritePage); //글쓰기페이지 이동
router.get("/getIngredients", writeController.getIngredients); //재료 검색(요청)시 컨트롤러로 넘김
router.get("/getMenu",writeController.getMenu); // 메뉴 검색(요청) 시 컨트롤러로 넘김
router.post("/postWrite",writeController.postWrite); // 글을 처리해줄 경로
router.post("/postImage",upload.single("img"), writeController.postImage); // file upload 처리
router.get("/getWritedPage",writeController.getWritedPage);
router.post("/postCommentPage",writeController.postCommentPage);
router.post("/commentUpdate",writeController.commentUpdate);
router.post("/commentDelete",writeController.commentDelete);
router.get("/viewUpdatePage",writeController.viewUpdatePage);
router.post("/updatePost",writeController.updatePost);
router.post("/increaseViews",writeController.increaseViews)
router.post("/deletePost",writeController.deletePost);
//파일 업로드위해 upload 미들웨어 사용
module.exports = router;


