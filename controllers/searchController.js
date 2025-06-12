const axios = require("axios");
const db = require("../models/index"),
  Post = db.post,
  Op = db.Sequelize.Op;

const { Sequelize, sequelize } = require("../models");

const SEARCH_SERVICE = process.env.SEARCH_SERVICE;
const SEARCH_SERVICE_PORT = process.env.SEARCH_SERVICE_PORT;

exports.fetchSearchResults = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const searchQuery = req.query.material || "";
    const sort = req.query.sort || "popularity";
    const currentPage = parseInt(req.query.page) || 1;
    const pageSize = 5;

    // 1. axios로 검색 서비스에서 결과 받기
    const response = await axios.get(
      `http://${SEARCH_SERVICE}:${SEARCH_SERVICE_PORT}/search-service/`,
      { params: { material: searchQuery } }
    );
    console.log("결과: ", response.data);
    const recommendedPosts = Array.isArray(response.data) ? response.data : [];

    // postIds만 뽑기
    const postIds = recommendedPosts.map((hit) => hit._id);
    // const postIds = recommendedPosts.map((hit) => JSON.stringify(hit._id)); // 객체를 전달받아서 테스트로 stringify 한 것
    console.log("포스트 아이디: ", postIds);

    // 2. 정렬 조건 정의
    let order = [
      Sequelize.literal(
        "(SELECT views FROM views WHERE views.postId = post.postId LIMIT 1) DESC, date DESC"
      ),
    ];
    if (sort === "latest") order = [["date", "DESC"]];
    else if (sort === "oldest") order = [["date", "ASC"]];
    else if (sort === "comments")
      order = [
        Sequelize.literal(
          "(SELECT COUNT(*) FROM comments WHERE comments.postId = post.postId LIMIT 1) DESC, date DESC"
        ),
      ];

    // 3. DB에서 postIds에 해당하는 포스트, 댓글, 이미지, 재료 조회 (페이징 적용)
    const postNum = postIds.length;
    const pageNum = Math.ceil(postNum / pageSize);
    const offset = (currentPage - 1) * pageSize;

    const posts = await Post.findAll({
      where: { postId: postIds },
      include: [
        { model: db.ingredient, through: { attributes: [] } },
        { model: db.comment, attributes: [] },
        { model: db.image, as: "images" },
      ],
      group: ["post.postId"],
      order,
      limit: pageSize,
      offset,
    });

    // 4. 재료 문자열로 묶기
    let ingredientMap = {};
    if (postIds.length > 0) {
      const query = `
        SELECT p.postId,
               GROUP_CONCAT(DISTINCT i.ingredientName ORDER BY i.ingredientName SEPARATOR ', ') AS ingredients
        FROM posts p
        LEFT JOIN usages pi ON p.postId = pi.postId
        LEFT JOIN ingredients i ON pi.ingredientId = i.ingredientId
        WHERE p.postId IN (:postIds)
        GROUP BY p.postId;
      `;
      const ingredientResults = await sequelize.query(query, {
        replacements: { postIds },
        type: Sequelize.QueryTypes.SELECT,
      });

      ingredientMap = ingredientResults.reduce((map, item) => {
        map[item.postId] = item.ingredients;
        return map;
      }, {});
    }

    const postsWithIngredients = posts.map((post) => ({
      ...post.get({ plain: true }),
      ingredients: ingredientMap[post.postId] || "",
    }));

    // 5. 로그인된 사용자의 저장된 postId 조회
    let savedPostIds = [];
    if (userId) {
      const savedPosts = await db.save.findAll({
        where: { userId },
        attributes: ["postId"],
      });
      savedPostIds = savedPosts.map((save) => save.postId);
    }

    // 6. 렌더링
    res.render("recipe/searchResult", {
      showCategoryBar: true,
      filteredPosts: postsWithIngredients, // 검색 결과 게시물
      result_posts: postsWithIngredients, // 아마 같은 용도로 사용 중인 듯
      searchQuery,
      sort,
      savedPostIds,
      user: { userId },
      pageNum,
      currentPage,
    });
  } catch (err) {
    console.error("검색 서비스 요청 실패 또는 DB 조회 오류:", err);
    res.status(500).render("recipe/searchResult", {
      showCategoryBar: true,
      filteredPosts: [],
      result_posts: [],
      searchQuery: req.query.material || "",
      sort: req.query.sort || "popularity",
      savedPostIds: [],
      user: { userId: req.user?.userId || null },
      pageNum: 0,
      currentPage: 1,
    });
  }
};

exports.fetchAuto = async (req, res) => {
  try {
    const response = await axios.get(
      `http://${SEARCH_SERVICE}:${SEARCH_SERVICE_PORT}/autocomplete`
    );
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log("400 에러 발생: 자동 완성 결과 없음");
      postIds = [];
    } else {
      // 다른 에러는 로그로 확인
      console.error("에러 발생:", error);
      throw error; // 필요에 따라 다시 던질 수 있음
    }
  }
};
