import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/tips
 * @description Retrieves a list of tip IDs that the authenticated user has completed
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT tip_id FROM completed_tips WHERE user_id = $1', [req.user.id]);
    const tipIds = result.rows.map(row => row.tip_id);
    res.json(tipIds);
  } catch (error) {
    console.error('Fetch tips error:', error);
    res.status(500).json({ error: 'Server error fetching completed tips' });
  }
});

/**
 * @route POST /api/tips
 * @description Toggles the completion status of a specific eco-tip
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  const { tipId, completed } = req.body;

  if (!tipId) {
    return res.status(400).json({ error: 'Tip ID is required' });
  }

  try {
    if (completed) {
      await query(
        'INSERT INTO completed_tips (user_id, tip_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, tipId]
      );
    } else {
      await query(
        'DELETE FROM completed_tips WHERE user_id = $1 AND tip_id = $2',
        [req.user.id, tipId]
      );
    }

    const result = await query('SELECT tip_id FROM completed_tips WHERE user_id = $1', [req.user.id]);
    const tipIds = result.rows.map(row => row.tip_id);
    res.json(tipIds);
  } catch (error) {
    console.error('Toggle tip error:', error);
    res.status(500).json({ error: 'Server error toggling eco tip' });
  }
});

export default router;
