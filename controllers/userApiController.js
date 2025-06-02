const axios = require('axios');

//유저 서비스의 주소
const USER_SERVICE_URL = 'http://user-service:3001'; //실제 주소 필요

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
