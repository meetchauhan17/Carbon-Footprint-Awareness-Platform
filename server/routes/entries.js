import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/entries
 * @description Retrieves all carbon entries for the authenticated user
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, date, category, total_co2, details FROM carbon_entries WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );

    const entries = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      category: row.category,
      totalCO2: row.total_co2,
      ...row.details
    }));

    res.json(entries);
  } catch (error) {
    console.error('Fetch entries error:', error);
    res.status(500).json({ error: 'Server error fetching entries' });
  }
});

/**
 * @route POST /api/entries
 * @description Creates a new carbon footprint entry
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  const { category, totalCO2, date = new Date().toISOString(), ...details } = req.body;

  if (!category || totalCO2 === undefined) {
    return res.status(400).json({ error: 'Category and totalCO2 are required' });
  }

  try {
    const result = await query(
      `INSERT INTO carbon_entries (user_id, date, category, total_co2, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, date, category, total_co2, details`,
      [req.user.id, date, category, totalCO2, JSON.stringify(details)]
    );

    const row = result.rows[0];
    const newEntry = {
      id: row.id,
      date: row.date,
      category: row.category,
      totalCO2: row.total_co2,
      ...row.details
    };

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Add entry error:', error);
    res.status(500).json({ error: 'Server error adding entry' });
  }
});

/**
 * @route DELETE /api/entries/:id
 * @description Deletes a specific carbon footprint entry
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const entryId = req.params.id;

  try {
    const result = await query(
      'DELETE FROM carbon_entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [entryId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found or unauthorized' });
    }

    res.json({ success: true, deletedId: entryId });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Server error deleting entry' });
  }
});

/**
 * @route DELETE /api/entries
 * @description Deletes all carbon footprint entries (clear history) for a user
 * @access Private
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM carbon_entries WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Server error clearing history' });
  }
});

export default router;
