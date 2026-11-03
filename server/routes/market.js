const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  const category = typeof req.query.category === 'string' ? req.query.category : null;
  try {
    const result = await query(
      `SELECT products.*, users.display_name AS seller_name
       FROM products JOIN users ON users.id = products.seller_id
       WHERE products.available = true AND ($1::text IS NULL OR products.category = $1)
       ORDER BY products.created_at DESC LIMIT 100`,
      [category],
    );
    res.json({ products: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT products.*, users.display_name AS seller_name
       FROM products JOIN users ON users.id = products.seller_id
       WHERE products.id = $1 AND products.available = true`,
      [req.params.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { name, description = '', category, price, imageUrl = null } = req.body || {};
  const numericPrice = Number(price);
  if (typeof name !== 'string' || !name.trim() || name.length > 120
      || typeof category !== 'string' || !category.trim() || category.length > 60
      || !Number.isFinite(numericPrice) || numericPrice < 0
      || typeof description !== 'string' || description.length > 2000) {
    res.status(400).json({ error: 'Valid name, category, price, and description are required' });
    return;
  }
  try {
    const result = await query(
      `INSERT INTO products (seller_id, name, description, category, price, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name.trim(), description, category.trim(), numericPrice, imageUrl],
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/orders', async (req, res, next) => {
  const quantity = Number(req.body?.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    res.status(400).json({ error: 'Quantity must be an integer between 1 and 10,000' });
    return;
  }
  try {
    const product = await query(
      'SELECT id, price FROM products WHERE id = $1 AND available = true',
      [req.params.id],
    );
    if (!product.rows[0]) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const result = await query(
      `INSERT INTO orders (buyer_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, product.rows[0].id, quantity, product.rows[0].price],
    );
    res.status(201).json({ order: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
