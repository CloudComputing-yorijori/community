const axios = require("axios");
const SEARCH_SERVICE = process.env.SEARCH_SERVICE;
const SEARCH_SERVICE_PORT = process.env.SEARCH_SERVICE_PORT;

exports.fetchSearchResults = async (req, res) => {
  const userId = req.params.userId || req.user?.userId;
  const searchQuery = req.query.material || "";
  const sort = req.query.sort || "latest";
  const currentPage = parseInt(req.query.page) || 1;
  const pageSize = 5;

  if (!userId) {
    return res.status(400).render("recipe/searchResult", {
      result_posts: [],
      totalResults: 0,
      showCategoryBar: true,
      user: { userId: null },
      pageNum: 0,
      currentPage: 1,
      searchQuery,
      sort,
    });
  }

  try {
    const response = await axios.get(
      `http://${SEARCH_SERVICE}:${SEARCH_SERVICE_PORT}/search/recommend/${userId}`
    );
    const recommendedPosts = Array.isArray(response.data) ? response.data : [];

    const totalResults = recommendedPosts.length;
    const pageNum = Math.ceil(totalResults / pageSize);
    const paginatedPosts = recommendedPosts
      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
      .map((hit) => ({
        postId: hit._id,
        title: hit._source.title,
        content: hit._source.content,
        images: hit._source.images || [],
        ingredients: hit._source.ingredients || "",
      }));

    res.render("recipe/searchResult", {
      result_posts: paginatedPosts,
      totalResults,
      showCategoryBar: true,
      user: { userId },
      pageNum,
      currentPage,
      searchQuery,
      sort,
    });
  } catch (error) {
    console.error("검색 서비스 요청 실패:", error.message);
    res.status(500).render("recipe/searchResult", {
      result_posts: [],
      totalResults: 0,
      showCategoryBar: true,
      user: { userId },
      pageNum: 0,
      currentPage: 1,
      searchQuery,
      sort,
    });
  }
};
