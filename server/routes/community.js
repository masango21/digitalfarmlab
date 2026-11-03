const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT posts.id, posts.body, posts.image_url, posts.created_at,
        users.id AS user_id, users.display_name, users.avatar_url,
        COUNT(DISTINCT post_likes.user_id)::int AS like_count,
        COUNT(DISTINCT comments.id)::int AS comment_count
       FROM posts
       JOIN users ON users.id = posts.user_id
       LEFT JOIN post_likes ON post_likes.post_id = posts.id
       LEFT JOIN comments ON comments.post_id = posts.id
       GROUP BY posts.id, users.id ORDER BY posts.created_at DESC LIMIT 50`,
    );
    res.json({ posts: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { body, imageUrl = null } = req.body || {};
  if (typeof body !== 'string' || !body.trim() || body.trim().length > 5000) {
    res.status(400).json({ error: 'Post text must be between 1 and 5,000 characters' });
    return;
  }
  try {
    const result = await query(
      'INSERT INTO posts (user_id, body, image_url) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, body.trim(), imageUrl],
    );
    res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/likes', async (req, res, next) => {
  try {
    const post = await query('SELECT id FROM posts WHERE id = $1', [req.params.id]);
    if (!post.rows[0]) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const existing = await query(
      'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING post_id',
      [req.params.id, req.user.id],
    );
    if (existing.rowCount) {
      res.json({ liked: false });
    } else {
      await query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);
      res.json({ liked: true });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT comments.id, comments.body, comments.created_at,
        users.id AS user_id, users.display_name, users.avatar_url
       FROM comments JOIN users ON users.id = comments.user_id
       WHERE comments.post_id = $1 ORDER BY comments.created_at ASC LIMIT 100`,
      [req.params.id],
    );
    res.json({ comments: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comments', async (req, res, next) => {
  const { body } = req.body || {};
  if (typeof body !== 'string' || !body.trim() || body.trim().length > 2000) {
    res.status(400).json({ error: 'Comment must be between 1 and 2,000 characters' });
    return;
  }
  try {
    const result = await query(
      `INSERT INTO comments (post_id, user_id, body)
       SELECT posts.id, $2, $3 FROM posts WHERE posts.id = $1
       RETURNING *`,
      [req.params.id, req.user.id, body.trim()],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
