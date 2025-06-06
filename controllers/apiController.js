const db = require("../models/index"),
  Post = db.post,
  Ingredient = db.ingredient;
Op = db.Sequelize.Op;

const { Sequelize, sequelize } = require("../models");

exports.getPostsByUserId = async (req, res) => {
  const userId = req.params.userId;

  try {
    const query = `
      SELECT p.postId, p.title, p.userId, i.imageUrl
      FROM posts p
      LEFT JOIN images i ON p.postId = i.postId
      WHERE p.userId = :userId;
    `;
    const posts = await sequelize.query(query, {
      replacements: { userId },
      type: Sequelize.QueryTypes.SELECT,
    });
    res.json(posts);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getPostsByPostId = async (req, res) => {
  const postId = req.params.postId;
  try {
    const query = `
      SELECT p.postId, p.title, p.userId, p.date
      FROM posts p
      WHERE p.post = :postId;
    `;
    const posts = await sequelize.query(query, {
      replacements: { postId },
      type: Sequelize.QueryTypes.SELECT,
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSavedPostsByUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const query = `
      SELECT p.title, p.date, p.postId
      FROM saves s
      LEFT JOIN posts p ON s.postId = p.postId
      WHERE s.userId = :userId;
    `;
    const savedPosts = await sequelize.query(query, {
      replacements: { userId },
      type: Sequelize.QueryTypes.SELECT,
    });
    res.json(savedPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCommentsByUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const query = `
      SELECT p.title, c.content, c.createdAt, p.postId
      FROM comments c
      LEFT JOIN posts p ON p.postId = c.postId
      WHERE c.userId = :userId;
    `;
    const comments = await sequelize.query(query, {
      replacements: { userId },
      type: Sequelize.QueryTypes.SELECT,
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { query, sort, page = 1 } = req.query;
    const pageSize = 5;
    const offset = (page - 1) * pageSize;

    let order = [
      Sequelize.literal(
        "(SELECT views FROM views WHERE views.postId = post.postId LIMIT 1) DESC, date DESC"
      ),
    ];

    if (sort === "latest") {
      order = [["date", "DESC"]];
    } else if (sort === "oldest") {
      order = [["date", "ASC"]];
    } else if (sort === "comments") {
      order = [
        Sequelize.literal(
          "(SELECT COUNT(*) FROM comments WHERE comments.postId = post.postId) DESC, date DESC"
        ),
      ];
    }

    const whereCondition = query
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${query}%` } },
            { "$ingredients.ingredientName$": { [Op.like]: `%${query}%` } },
          ],
        }
      : {};

    // 1) 검색 결과 게시물 조회 (기본 정보만)
    const posts = await Post.findAll({
      where: whereCondition,
      include: [
        {
          model: Ingredient,
          through: { attributes: [] },
          attributes: [], // 여기서는 재료 이름 안받음, 따로 쿼리로 처리
        },
      ],
      group: ["post.postId"],
      order: order,
      limit: pageSize,
      offset: offset,
      attributes: ["postId", "title", "date" /* 필요한 필드들 */],
      raw: true,
    });

    const postIds = posts.map((p) => p.postId);
    let ingredientMap = {};

    if (postIds.length > 0) {
      // 2) postId별 재료 이름들을 한 문자열로 묶어서 가져오기
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

    // 3) 각 post에 재료 문자열 추가
    const postsWithIngredients = posts.map((post) => ({
      ...post,
      ingredients: ingredientMap[post.postId] || "",
    }));

    res.json(postsWithIngredients);
  } catch (err) {
    console.error("Error in searchPosts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
