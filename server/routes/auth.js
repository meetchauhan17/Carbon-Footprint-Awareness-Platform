import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretcarbonwisejwtkey123!';

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

/**
 * @route POST /api/auth/register
 * @description Registers a new user and returns a JWT token
 * @access Public
 */
router.post('/register', async (req, res) => {
  const { email, password, name = '', location = '' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await query(
      `INSERT INTO users (email, password_hash, name, location)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, location, monthly_goal, diet_preference, vehicle_type, 
                 notifications_weekly_report, notifications_goal_alerts, notifications_eco_tips`,
      [email.toLowerCase(), passwordHash, name, location]
    );

    const user = newUser.rows[0];

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

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: userProfile });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

/**
 * @route POST /api/auth/login
 * @description Authenticates user and returns a JWT token
 * @access Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

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

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: userProfile });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * @route GET /api/auth/me
 * @description Fetches current authenticated user's profile
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
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

/**
 * @route POST /api/auth/forgot-password
 * @description Generates an OTP and sends it via email
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rows.length === 0) {
      return res.json({ message: 'If this email exists in our system, an OTP verification code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await query(
      `INSERT INTO password_resets (email, otp, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
      [email.toLowerCase(), otp, expiresAt]
    );

    console.log(`Password reset requested for: ${email}`);

    if (!mailTransporter) {
      console.warn(`Forgot password requested for ${email} but SMTP transporter is not configured.`);
      return res.status(500).json({ error: 'Email delivery service is not configured.' });
    }

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
      return res.status(500).json({ error: 'Failed to send verification email.' });
    }

    res.json({ message: 'If this email exists in our system, an OTP verification code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error requesting password reset' });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @description Verifies the OTP and resets the user's password
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const resetCheck = await query('SELECT * FROM password_resets WHERE email = $1', [email.toLowerCase()]);
    if (resetCheck.rows.length === 0) {
      return res.status(400).json({ error: 'No active password reset request found for this email' });
    }

    const record = resetCheck.rows[0];

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email.toLowerCase()]);
    await query('DELETE FROM password_resets WHERE email = $1', [email.toLowerCase()]);

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

export default router;
