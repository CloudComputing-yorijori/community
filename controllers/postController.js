const db = require("../models/index"),
Post = db.post,
Op = db.Sequelize.Op;

const { Sequelize, sequelize } = require('../models');

// 많이 본 & 최신 게시글 (로그인 X)
exports.getNoLoginRecommendPosts = async (req, res) => {
    const userId = req.user?.userId || ""; // 사용자 id 받아오기

    try {
        // 페이징 변수들
        const postNum = await db.post.count(); // 포스트 전체 개수 가져오기
        const pageSize = 6; // 한 페이지 당 보여줄 포스트 개수
        const currentPage = req.query.page ? parseInt(req.query.page) : 1; // page 존재하지 않으면 1로 설정
        const offset = (currentPage - 1)*pageSize; //페이지 오프셋

        const posts = await db.post.findAll({
            include: [
              {
                model: db.ingredient,
                through: { attributes: [] } // 'Usage' 테이블의 필드는 가져오지 않음
              },
              {
                model: db.image,
                as: 'images'
              },
              {
                model: db.view,
                attributes: ['views'] // Fetch the views attribute
              }
            ],
            order: [[db.view, 'views', 'DESC'], ['date', 'DESC']], // 조회수, 작성일 기준 내림차순 정렬
            limit: pageSize,
            offset: offset
        });

        const pageNum = Math.ceil(postNum / pageSize); // 페이지 개수

        const postIds = posts.map(post => post.postId);

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
            type: Sequelize.QueryTypes.SELECT
        });

        const ingredientMap = ingredientResults.reduce((map, item) => {
            map[item.postId] = item.ingredients;
            return map;
        }, {});

        const postsWithIngredients = posts.map(post => ({
            ...post.get({ plain: true }),
            ingredients: ingredientMap[post.postId] || ''
        }));

        res.render("recipe/noLoginRecommendPosts", {
            posts: postsWithIngredients,
            showCategoryBar: true,
            user: { userId },
            pageNum: pageNum, // 전체 페이지 개수
            currentPage: currentPage //현재 페이지
        });
    } catch (err) {
        console.error("Error: ", err);
        res.status(500).send({
            message: err.message
        });
    }
};

// 많이 본 & 사용자 맞춤 추천 게시글 (로그인 O)
exports.getLoginRecommendPosts = async (req, res) => {
    const userId = req.user.userId; // 사용자 id 받아오기

    try {
        // 1. 많이 본 게시글 3개 가져오기
        const viewPosts = await db.post.findAll({
            include: [
                {
                    model: db.ingredient,
                    through: { attributes: [] }
                },
                {
                    model: db.image,
                    as: 'images'
                },
                {
                    model: db.view,
                    attributes: ['views']
                }
            ],
            order: [[db.view, 'views', 'DESC']]
        });

        const viewPostIds = viewPosts.map(post => post.postId);

        const viewQuery = `
            SELECT p.postId,
                   GROUP_CONCAT(DISTINCT i.ingredientName ORDER BY i.ingredientName SEPARATOR ', ') AS ingredients
            FROM posts p
            LEFT JOIN usages pi ON p.postId = pi.postId
            LEFT JOIN ingredients i ON pi.ingredientId = i.ingredientId
            WHERE p.postId IN (:viewPostIds)
            GROUP BY p.postId;
        `;

        const viewIngredientResults = await sequelize.query(viewQuery, {
            replacements: { viewPostIds },
            type: Sequelize.QueryTypes.SELECT
        });

        const viewIngredientMap = viewIngredientResults.reduce((map, item) => {
            map[item.postId] = item.ingredients;
            return map;
        }, {});

        const viewPostsWithIngredients = viewPosts.map(post => ({
            ...post.get({ plain: true }),
            ingredients: viewIngredientMap[post.postId] || ''
        }));

        // 2. 사용자가 클릭한 게시글 및 저장한 게시글 ID 조회
        const [viewedPosts, savedPosts] = await Promise.all([
            db.view.findAll({
                where: { userId },
                attributes: ['postId']
            }),
            db.save.findAll({
                where: { userId },
                attributes: ['postId']
            })
        ]);

        const savedPostIds = savedPosts.map(save => save.postId);
        const uniquePostIds = [...new Set([...viewedPosts.map(v => v.postId), ...savedPosts.map(s => s.postId)])];

        // 3. 추천 게시글 9개 가져오기
        let recommendPostsWithIngredients = [];
        if (uniquePostIds.length > 0) {
            const relatedPosts = await db.post.findAll({
                where: {
                    postId: { [Op.in]: uniquePostIds }
                },
                include: [{ model: db.menu }]
            });
    
            const relatedCategories = [...new Set(relatedPosts.map(post => post.menu.category))];
            const relatedTitles = [...new Set(relatedPosts.map(post => post.title.split(' ')).flat())];
    
            const recommendedPostResults = await db.post.findAll({
                where: {
                    [Op.or]: [
                        {
                            menuId: {
                                [Op.in]: (await db.menu.findAll({
                                    where: { category: { [Op.in]: relatedCategories } },
                                    attributes: ['menuId']
                                })).map(menu => menu.menuId)
                            }
                        },
                        {
                            title: {
                                [Op.or]: relatedTitles.map(title => ({ [Op.like]: `%${title}%` }))
                            }
                        }
                    ],
                    postId: { [Op.notIn]: uniquePostIds } // 사용자가 보거나 저장하지 않은 게시글 중 추천
                },
                include: [
                    {
                        model: db.ingredient,
                        through: { attributes: [] }
                    },
                    {
                        model: db.image,
                        as: 'images'
                    },
                    {
                        model: db.view,
                        attributes: ['views']
                    }
                ],
                order: [[db.view, 'views', 'DESC'], ['date', 'DESC']]
            });
    
            const recommendedPostIds = recommendedPostResults.map(post => post.postId);
    
            // recommendedPostIds가 비어 있는지 확인
            if (recommendedPostIds.length > 0) {
                const recommendQuery = `
                    SELECT p.postId,
                           GROUP_CONCAT(DISTINCT i.ingredientName ORDER BY i.ingredientName SEPARATOR ', ') AS ingredients
                    FROM posts p
                    LEFT JOIN usages pi ON p.postId = pi.postId
                    LEFT JOIN ingredients i ON pi.ingredientId = i.ingredientId
                    WHERE p.postId IN (:recommendedPostIds)
                    GROUP BY p.postId;
                `;
                const recommendIngredientResults = await sequelize.query(recommendQuery, {
                    replacements: { recommendedPostIds },
                    type: Sequelize.QueryTypes.SELECT
                });
    
                const recommendIngredientMap = recommendIngredientResults.reduce((map, item) => {
                    map[item.postId] = item.ingredients;
                    return map;
                }, {});
    
                recommendPostsWithIngredients = recommendedPostResults.map(post => ({
                    ...post.get({ plain: true }),
                    ingredients: recommendIngredientMap[post.postId] || ''
                }));
            }
        }

        // 4. 결과 렌더링
        res.render("recipe/loginRecommendPosts", {
            viewPosts: viewPostsWithIngredients,
            recommendPosts: recommendPostsWithIngredients,
            savedPostIds,
            showCategoryBar: true,
            user: { userId } // 사용자 정보 추가
        });
    } catch (err) {
        console.error("Error: ", err);
        res.status(500).send({
            message: err.message
        });
    }
};

// 메인 카테고리별 게시글
exports.getPostsByCategory = async (req, res) => {
    const userId = req.user?.userId || 16; // 사용자 id 받아오기
    const category = req.params.category; // URL에서 카테고리 받기
    const sort = req.query.sort; // 정렬 방법 읽기

    // 디폴트 정렬 방법: 조회수 순 (popularity)
    let order = [[db.view, 'views', 'DESC']];

    // 정렬 방법 선택
    if (sort === 'latest') {
        order = [['date', 'DESC']]; // 최신순
    } else if (sort === 'oldest') {
        order = [['date', 'ASC']]; // 과거순
    } else if (sort === 'comments') {
        order = [Sequelize.literal('(SELECT COUNT(*) FROM comments WHERE comments.postId = post.postId)'), 'DESC']; // 댓글 많은 순
    }

    try {
        // 페이징 변수들
        const postNum = await db.post.count(); // 포스트 전체 개수 가져오기
        const pageSize = 6; // 한 페이지 당 보여줄 포스트 개수
        const currentPage = req.query.page ? parseInt(req.query.page) : 1; // page 존재하지 않으면 1로 설정
        const offset = (currentPage - 1) * pageSize; // 페이지 오프셋

        const posts = await Post.findAll({
            include: [
                {
                    model: db.menu,
                    where: { category: category } // 카테고리 필터링
                },
                {
                    model: db.ingredient,
                    through: { attributes: [] } // 'Usage' 테이블의 필드는 가져오지 않음
                },
                {
                    model: db.image,
                    as: 'images'
                },
                {
                    model: db.view,
                    attributes: ['views'] // 조회수 속성 가져오기
                }
            ],
            order: order, // 정렬 적용
            limit: pageSize,
            offset: offset
        });

        const pageNum = Math.ceil(postNum / pageSize); // 페이지 개수
        const totalNum = posts.length;

        const postIds = posts.map(post => post.postId);

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
                type: Sequelize.QueryTypes.SELECT
            });

            ingredientMap = ingredientResults.reduce((map, item) => {
                map[item.postId] = item.ingredients;
                return map;
            }, {});
        }

        const postsWithIngredients = posts.map(post => ({
            ...post.get({ plain: true }),
            ingredients: ingredientMap[post.postId] || ''
        }));

        // 사용자가 클릭한 게시글 및 저장한 게시글 ID 조회
        const savedPosts = await db.save.findAll({
            where: { userId },
            attributes: ['postId']
        });

        const savedPostIds = savedPosts.map(save => save.postId);

        res.render('recipe/categoryPosts', { // 카테고리별 포스트 렌더링할 뷰
            posts: postsWithIngredients,
            category: category,
            showCategoryBar: true,
            savedPostIds,
            user: { userId },
            sort: sort, // 현재 정렬 방법 전달
            pageNum: pageNum, // 전체 페이지 개수
            totalNum: totalNum,
            currentPage: currentPage // 현재 페이지
        });

    } catch (error) {
        console.error("Error fetching posts by category:", error);
        res.status(500).send("Error retrieving posts");
    }
};

// 세부 카테고리별 게시글
exports.getPostsBySubcategory = async (req, res) => {
    const userId = req.user?.userId || 16; // 사용자 id 받아오기
    const { category, subcategory } = req.params; // URL에서 메인 카테고리와 세부 카테고리 받기
    const sort = req.query.sort; // 정렬 방법 읽기

    // 디폴트 정렬 방법: 조회수 순 (popularity)
    let order = 'views DESC';

    // 정렬 방법 선택
    if (sort === 'latest') {
        order = 'p.date DESC'; // 최신순
    } else if (sort === 'oldest') {
        order = 'p.date ASC'; // 과거순
    } else if (sort === 'comments') {
        order = '(SELECT COUNT(*) FROM comments WHERE comments.postId = p.postId) DESC'; // 댓글 많은 순
    }

    try {
        // 페이징 변수들
        const pageSize = 6; // 한 페이지 당 보여줄 포스트 개수
        const currentPage = req.query.page ? parseInt(req.query.page) : 1; // page 존재하지 않으면 1로 설정
        const offset = (currentPage - 1) * pageSize; // 페이지 오프셋

        let subcategoryCondition = '';
        if (subcategory !== 'all') {
            subcategoryCondition = `AND i.category = :subcategory`;
        }

        const subCategoryQuery = `
            SELECT p.postId, p.title, p.date, p.content,
                GROUP_CONCAT(DISTINCT i.ingredientName ORDER BY i.ingredientName SEPARATOR ', ') AS ingredients,
                COALESCE(MAX(v.views), 0) AS views,
                (SELECT imageUrl FROM images img WHERE img.postId = p.postId LIMIT 1) AS firstImage
            FROM posts p
            JOIN usages u ON p.postId = u.postId
            JOIN ingredients i ON u.ingredientId = i.ingredientId
            JOIN menus m ON p.menuId = m.menuId
            LEFT JOIN views v ON p.postId = v.postId
            WHERE m.category = :category
            ${subcategoryCondition}
            GROUP BY p.postId, p.title, p.date, p.content
            ORDER BY ${order}
            LIMIT :pageSize OFFSET :offset;
        `;

        // 세부 카테고리로 필터링 된 게시글
        const filteredPosts = await sequelize.query(subCategoryQuery, {
            replacements: {
                category,
                subcategory,
                pageSize,
                offset
            },
            type: Sequelize.QueryTypes.SELECT,
            model: Post
        });

        const postCountQuery = `
            SELECT COUNT(*) as count
            FROM posts p
            JOIN usages u ON p.postId = u.postId
            JOIN ingredients i ON u.ingredientId = i.ingredientId
            JOIN menus m ON p.menuId = m.menuId
            LEFT JOIN views v ON p.postId = v.postId
            WHERE m.category = :category
            ${subcategoryCondition}
        `;

        const postCountResult = await sequelize.query(postCountQuery, {
            replacements: {
                category,
                subcategory
            },
            type: Sequelize.QueryTypes.SELECT
        });

        const postNum = postCountResult[0].count;
        const pageNum = Math.ceil(postNum / pageSize); // 전체 페이지 개수

        const postIds = filteredPosts.map(post => post.postId); // 필터링된 포스트의 모든 재료 가져오기

        let postsWithIngredients = filteredPosts.map(post => ({
            ...post.get({ plain: true }),
            ingredients: ''
        }));

        // 재료 나열
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
                type: Sequelize.QueryTypes.SELECT
            });

            const ingredientMap = ingredientResults.reduce((map, item) => {
                map[item.postId] = item.ingredients;
                return map;
            }, {});

            postsWithIngredients = filteredPosts.map(post => ({
                ...post.get({ plain: true }),
                ingredients: ingredientMap[post.postId] || ''
            }));
        }

        // 사용자가 클릭한 게시글 및 저장한 게시글 ID 조회
        const savedPosts = await db.save.findAll({
            where: { userId },
            attributes: ['postId']
        });

        const savedPostIds = savedPosts.map(save => save.postId);

        res.render('recipe/subCategoryPosts', { // 세부 카테고리별 포스트 렌더링할 뷰
            posts: postsWithIngredients,
            category: category,
            subcategory: subcategory,
            showCategoryBar: true,
            showSubCategoryBar: true,
            savedPostIds,
            user: { userId },
            sort: sort, // 현재 정렬 방법 전달
            pageNum: pageNum, // 전체 페이지 개수
            totalNum: postNum,
            currentPage: currentPage //현재 페이지
        });


    } catch (error) {
        console.error("Error fetching posts by subcategory:", error);
        res.status(500).send("Error retrieving posts");
    }
};

// 북마크 시 게시글 저장
exports.postSave = async (req, res) => {
    const { userId, postId } = req.body;

    try {
        await db.save.create({ userId, postId });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
};

// 북마크 해제 시 게시글 삭제
exports.postUnsave = async (req, res) => {
    const { userId, postId } = req.body;

    try {
        await db.save.destroy({ where: { userId, postId } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
};

// 클릭 시 게시글 조회수 증가
exports.incrementView = async (req, res) => {
    const { userId, postId } = req.body;

    try {
        // Check if the view entry exists for the given postId
        let view = await db.view.findOne({ where: { userId, postId } });

        if (!view) {
            // If it doesn't exist, create a new entry with an initial view count of 1
            view = await db.view.create({ userId, postId, views: 1 });
        } else {
            // If it exists, increment the view count
            view.views += 1;
            await view.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
};