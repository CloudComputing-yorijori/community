const axios = require('axios');

// 유저 서비스의 주소
const USER_SERVICE_URL = 'http://user-service:3001'; // 실제 주소 필요

// 사용자 정보 요청
exports.getUserInfo = async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
    
    res.json(response.data); // 받은 데이터 그대로 반환
  } catch (error) {
    console.error('User Info 요청 실패:', error.message);
    res.status(500).json({ message: 'User 서비스에서 사용자 정보를 불러오지 못했습니다.' });
  }
};

// 1. 특정 유저가 작성한 게시글
exports.getMyPosts = async (req, res) => {
  const { userId } = req.params;
  try {
    const posts = await post.findAll({
      where: { userId },
      order: [["date", "DESC"]],
    });

    // 다른 서비스로 전송
    await axios.post(`${USER_SERVICE_URL}/users/${userId}/posts`, {
      userId,
      posts,  // posts를 보내는 것
    });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "사용자 게시글 조회 실패", error });
  }
};

// 2. 특정 유저가 작성한 댓글
exports.getMyComments = async (req, res) => {
  const { userId } = req.params;
  try {
    const comments = await comment.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    // 다른 서비스로 전송
    await axios.post(`${USER_SERVICE_URL}/users/${userId}/comments`, {
      userId,
      comments,  // comments를 보내는 것
    });
    
    res.json(comments);  // 댓글 목록을 반환
  } catch (error) {
    res.status(500).json({ message: "사용자 댓글 조회 실패", error });
  }
};

// 3. 특정 유저가 저장한 게시글
exports.getSavedPosts = async (req, res) => {
  const { userId } = req.params;
  try {
    const savedPosts = await post.findAll({
      include: [
        {
          model: user,
          as: "users",
          through: { where: { userId } },
          attributes: [],
        },
      ],
    });

    // 다른 서비스로 전송
    await axios.post(`${USER_SERVICE_URL}/users/${userId}/saved-posts`, {
      userId,
      savedPosts,  // 저장된 게시글을 보내는 것
    });
    
    res.json(savedPosts);  // 저장된 게시글 목록을 반환
  } catch (error) {
    res.status(500).json({ message: "저장한 게시글 조회 실패", error });
  }
};
