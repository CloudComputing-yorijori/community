CREATE DATABASE yorijori_community;
USE yorijori_community;

-- Users
CREATE TABLE users (
  userId INTEGER PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(1024) NOT NULL,
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  town VARCHAR(255) NOT NULL,
  detail VARCHAR(255),
  imageUrl VARCHAR(255),
  mysalt VARCHAR(255)
);

-- Menus
CREATE TABLE menus (
  menuId INTEGER PRIMARY KEY AUTO_INCREMENT,
  menuName VARCHAR(255) NOT NULL,
  cookingTime INTEGER,
  category VARCHAR(255) NOT NULL
);

-- Ingredients
CREATE TABLE ingredients (
  ingredientId INTEGER PRIMARY KEY AUTO_INCREMENT,
  ingredientName VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL
);

-- Posts
CREATE TABLE posts (
  postId INTEGER PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  date DATETIME NOT NULL,
  menuId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  FOREIGN KEY (menuId) REFERENCES menus(menuId),
  FOREIGN KEY (userId) REFERENCES users(userId)
);

-- Images
CREATE TABLE images (
  imageId INTEGER PRIMARY KEY AUTO_INCREMENT,
  postId INTEGER NOT NULL,
  imageUrl VARCHAR(255) NOT NULL,
  FOREIGN KEY (postId) REFERENCES posts(postId)
);

-- Saves
CREATE TABLE saves (
  userId INTEGER NOT NULL,
  postId INTEGER NOT NULL,
  PRIMARY KEY (userId, postId),
  FOREIGN KEY (userId) REFERENCES users(userId),
  FOREIGN KEY (postId) REFERENCES posts(postId)
);

-- Usages
CREATE TABLE usages (
  ingredientId INTEGER NOT NULL,
  postId INTEGER NOT NULL,
  PRIMARY KEY (ingredientId, postId),
  FOREIGN KEY (ingredientId) REFERENCES ingredients(ingredientId),
  FOREIGN KEY (postId) REFERENCES posts(postId)
);

-- Views
CREATE TABLE views (
  userId INTEGER,
  postId INTEGER NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (userId, postId),
  FOREIGN KEY (userId) REFERENCES users(userId),
  FOREIGN KEY (postId) REFERENCES posts(postId)
);

-- Comments
CREATE TABLE comments (
  commentId INTEGER AUTO_INCREMENT,
  content TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  postId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  PRIMARY KEY (commentId, postId),
  FOREIGN KEY (postId) REFERENCES posts(postId),
  FOREIGN KEY (userId) REFERENCES users(userId)
);

-- INSERT test data
INSERT INTO users (email, password, name, nickname, phoneNumber, city, district, town, detail, imageUrl, mysalt) VALUES
('user1@example.com', 'password1', 'John Doe', 'Johnny', '010-1234-5678', 'Seoul', 'Gangnam-gu', 'Yeoksam-dong', 'Detailed Address 1', NULL, 'salt1'),
('user2@example.com', 'password2', 'Chris Kim', 'Chris', '010-2345-6789', 'Busan', 'Haeundae-gu', 'U-dong', NULL, NULL, 'salt2');

INSERT INTO menus (menuName, cookingTime, category) VALUES
('Doenjang Stew', 30, 'Korean'),
('Spaghetti', 25, 'Western');

INSERT INTO posts (title, content, date, menuId, userId) VALUES
('First Post', 'This is the content of the first post.', NOW(), 1, 1),
('Second Post', 'This is the content of the second post.', NOW(), 2, 2);

INSERT INTO comments (content, createdAt, postId, userId) VALUES
('Great post!', NOW(), 1, 2),
('Thank you!', NOW(), 1, 1);

INSERT INTO images (postId, imageUrl) VALUES
(1, 'https://example.com/image1.jpg'),
(2, 'https://example.com/image2.jpg');

INSERT INTO saves (userId, postId) VALUES
(1, 2),
(2, 1);

INSERT INTO views (userId, postId, views) VALUES
(1, 1, 5),
(2, 2, 3);

