import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route PUT /api/profile
 * @description Updates the user's profile information (location, goals, notifications)
 * @access Private
 */
router.put('/', authenticateToken, async (req, res) => {
  const { name, location, monthlyGoal, dietPreference, vehicleType, notifications } = req.body;

  try {
    const weeklyReport = notifications?.weeklyReport !== undefined ? notifications.weeklyReport : true;
    const goalAlerts = notifications?.goalAlerts !== undefined ? notifications.goalAlerts : true;
    const ecoTips = notifications?.ecoTips !== undefined ? notifications.ecoTips : false;

    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           monthly_goal = COALESCE($3, monthly_goal),
           diet_preference = COALESCE($4, diet_preference),
           vehicle_type = COALESCE($5, vehicle_type),
           notifications_weekly_report = COALESCE($6, notifications_weekly_report),
           notifications_goal_alerts = COALESCE($7, notifications_goal_alerts),
           notifications_eco_tips = COALESCE($8, notifications_eco_tips)
       WHERE id = $9
       RETURNING id, email, name, location, monthly_goal, diet_preference, vehicle_type, 
                 notifications_weekly_report, notifications_goal_alerts, notifications_eco_tips`,
      [name, location, monthlyGoal, dietPreference, vehicleType, weeklyReport, goalAlerts, ecoTips, req.user.id]
    );

    const user = result.rows[0];
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      location: user.location,
      monthlyGoal: user.monthly_goal,
      dietPreference: user.diet_preference,
      vehicleType: user.vehicle_type,
      notifications: {
        weeklyReport: user.notifications_weekly_report,
        goalAlerts: user.notifications_goal_alerts,
        ecoTips: user.notifications_eco_tips
      }
    };

    res.json(userProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

export default router;
