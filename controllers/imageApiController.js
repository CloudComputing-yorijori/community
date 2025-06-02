const axios = require("axios");

const IMAGE_SERVICE_URL = "http://image-service:3001";

exports.getImagesByPostId = async (postId) => {
  try {
    const response = await axios.get(
      `${IMAGE_SERVICE_URL}/images/by-post/${postId}`
    );
    return response.data; // 이미지 배열
  } catch (error) {
    console.error("이미지 서비스 요청 실패:", error.message);
    return []; // 실패 시 빈 배열 반환
  }
};
