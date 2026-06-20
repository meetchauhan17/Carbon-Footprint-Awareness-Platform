import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { query } from './db.js';

dotenv.config();

// Setup NodeMailer Transporter
const mailTransporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretcarbonwisejwtkey123!';

// Middleware
app.use(cors());
app.use(express.json());

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name = '', location = '' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await query(
      `INSERT INTO users (email, password_hash, name, location)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, location, monthly_goal, diet_preference, vehicle_type, 
                 notifications_weekly_report, notifications_goal_alerts, notifications_eco_tips`,
      [email.toLowerCase(), passwordHash, name, location]
    );

    const user = newUser.rows[0];

    // Format user profile response to match React client structure
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

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: userProfile });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Format user profile response
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

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: userProfile });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, location, monthly_goal, diet_preference, vehicle_type, 
              notifications_weekly_report, notifications_goal_alerts, notifications_eco_tips 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

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
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

// --- PROFILE ROUTES ---

// Update User Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { name, location, monthlyGoal, dietPreference, vehicleType, notifications } = req.body;

  try {
    // Unpack notifications sub-object if present
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

// --- CARBON ENTRIES ROUTES ---

// Get User's Entries
app.get('/api/entries', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, date, category, total_co2, details FROM carbon_entries WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );

    // Map DB fields back to frontend field names (total_co2 -> totalCO2)
    const entries = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      category: row.category,
      totalCO2: row.total_co2,
      ...row.details // Spreads categories and answers if stored inside details
    }));

    res.json(entries);
  } catch (error) {
    console.error('Fetch entries error:', error);
    res.status(500).json({ error: 'Server error fetching entries' });
  }
});

// Add Carbon Entry
app.post('/api/entries', authenticateToken, async (req, res) => {
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

// Delete Carbon Entry
app.delete('/api/entries/:id', authenticateToken, async (req, res) => {
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

// Delete All Carbon Entries (Clear History)
app.delete('/api/entries', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM carbon_entries WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Server error clearing history' });
  }
});

// --- ECO TIPS ROUTES ---

// Get Completed Tips
app.get('/api/tips', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT tip_id FROM completed_tips WHERE user_id = $1', [req.user.id]);
    const tipIds = result.rows.map(row => row.tip_id);
    res.json(tipIds);
  } catch (error) {
    console.error('Fetch tips error:', error);
    res.status(500).json({ error: 'Server error fetching completed tips' });
  }
});

// Toggle Eco Tip Completed
app.post('/api/tips', authenticateToken, async (req, res) => {
  const { tipId, completed } = req.body;

  if (!tipId) {
    return res.status(400).json({ error: 'Tip ID is required' });
  }

  try {
    if (completed) {
      // Insert if not exists
      await query(
        'INSERT INTO completed_tips (user_id, tip_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, tipId]
      );
    } else {
      // Delete
      await query(
        'DELETE FROM completed_tips WHERE user_id = $1 AND tip_id = $2',
        [req.user.id, tipId]
      );
    }

    // Return the updated list of completed tips
    const result = await query('SELECT tip_id FROM completed_tips WHERE user_id = $1', [req.user.id]);
    const tipIds = result.rows.map(row => row.tip_id);
    res.json(tipIds);
  } catch (error) {
    console.error('Toggle tip error:', error);
    res.status(500).json({ error: 'Server error toggling eco tip' });
  }
});

// --- PASSWORD RESET ROUTES ---

// Request Reset OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rows.length === 0) {
      // Return success message regardless of existence to prevent user enumeration
      return res.json({ message: 'If this email exists in our system, an OTP verification code has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Expiration: 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save/overwrite OTP in database
    await query(
      `INSERT INTO password_resets (email, otp, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
      [email.toLowerCase(), otp, expiresAt]
    );

    console.log(`\n--- [OTP SECURITY LOG] ---`);
    console.log(`Password reset requested for: ${email}`);
    console.log(`Generated OTP code: ${otp}`);
    console.log(`--------------------------\n`);

    // Send email if SMTP is configured
    if (mailTransporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"CarbonWise Support" <noreply@carbonwise.com>',
        to: email,
        subject: 'CarbonWise - Password Reset Verification Code',
        text: `Hello,\n\nYou requested a password reset for your CarbonWise account. Your 6-digit OTP verification code is:\n\n${otp}\n\nThis code will expire in 5 minutes. If you did not request this reset, please ignore this email.\n\nBest regards,\nThe CarbonWise Team`,
        html: `<div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #EA580C; font-size: 24px; text-align: center;">CarbonWise</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your CarbonWise account. Please use the following 6-digit OTP verification code:</p>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0F1115; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px;">This code is valid for 5 minutes. If you did not request this reset, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">CarbonWise — Carbon Footprint Awareness Platform</p>
        </div>`
      };

      try {
        await mailTransporter.sendMail(mailOptions);
        console.log(`OTP email sent successfully to ${email}`);
      } catch (emailErr) {
        console.error('Failed to send OTP email via SMTP:', emailErr.message);
      }
    }

    res.json({ message: 'If this email exists in our system, an OTP verification code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error requesting password reset' });
  }
});

// Verify OTP & Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Find the active reset token
    const resetCheck = await query('SELECT * FROM password_resets WHERE email = $1', [email.toLowerCase()]);
    if (resetCheck.rows.length === 0) {
      return res.status(400).json({ error: 'No active password reset request found for this email' });
    }

    const record = resetCheck.rows[0];

    // Verify OTP
    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Verify expiration
    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password in users table
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email.toLowerCase()]);

    // Delete the consumed reset token
    await query('DELETE FROM password_resets WHERE email = $1', [email.toLowerCase()]);

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`CarbonWise Backend Server running on port ${PORT}`);
});
