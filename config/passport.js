const axios = require("axios");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

// 1. 로그인 전략: username, password 받아서 유저 서비스 API 호출해 인증 처리
passport.use(
  new LocalStrategy(async function (email, password, done) {
    try {
      // 유저 서비스에 로그인 요청 (예: POST /login)
      const response = await axios.post(
        `http://user:3000/user-api/user/login`,
        {
          email,
          password,
        }
      );
      const { email, password } = req.body;

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (response.status === 200) {
        const user = response.data; // 유저 정보 받아옴
        return done(null, user);
      } else {
        return done(null, false, { message: "..." });
      }
    } catch (error) {
      return done(error);
    }
  })
);

// 2. serializeUser: 세션에 저장할 user id만 저장
passport.serializeUser(function (user, done) {
  done(null, user.userId); // user.userId 가 유저 서비스에서 오는 ID라고 가정
});

// 3. deserializeUser: 세션에 저장된 id로 유저 정보 다시 API 호출해서 가져오기
passport.deserializeUser(async function (id, done) {
  try {
    const response = await axios.get(`http://user:3000/api/users/${id}`);
    if (response.status === 200) {
      done(null, response.data); // req.user에 유저 정보 세팅
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
});
