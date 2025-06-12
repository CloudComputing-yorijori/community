// homeController.js
const User = require('../models/user'); // User 모델을 임포트합니다.

exports.getHomePage = async (req, res) => {
    try {
        res.render('home'); // home.ejs 파일 렌더링 (메인 페이지 화면)
    } catch (err) {
        console.error("Error loading the home page:", err);
        res.status(500).send({
            message: "Error loading the home page"
        });
    }
};

exports.index = async (req, res, next) => {
    try {
        let users = await User.findAll();
        res.locals.users = users;
        next();
    } catch (error) {
        console.log(`Error fetching users: ${error.message}`);
        next(error);
    }
};
