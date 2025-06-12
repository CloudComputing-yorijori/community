const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');


router.get('/home', homeController.getHomePage);
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/posts/loginRecommend');
    } else {
        res.redirect('/posts/noLoginRecommend');
    }
});

module.exports = router;
