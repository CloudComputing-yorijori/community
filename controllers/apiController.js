const axios = require("axios");
const { sequelize } = require("../models");
const Sequelize = require("sequelize");

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
