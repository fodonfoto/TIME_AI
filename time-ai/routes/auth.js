import express from 'express';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import otpDatabaseService from '../src/services/otpDatabaseService.js';

const router = express.Router();

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Generate secure OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Rate limiting store
const rateLimitStore = new Map();

// Check rate limit
const checkRateLimit = (email) => {
  const now = Date.now();
  const lastRequest = rateLimitStore.get(email);
  
  if (lastRequest && (now - lastRequest) < 60000) { // 1 minute
    return false;
  }
  
  rateLimitStore.set(email, now);
  return true;
};

// Google OAuth
router.get('/google', (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  res.json({ authUrl: url });
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    res.json({ tokens });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }
    
    // Check rate limit
    if (!checkRateLimit(email)) {
      return res.status(429).json({ 
        success: false, 
        error: 'Please wait 1 minute before requesting another OTP' 
      });
    }
    
    // Create OTP in database
    const otpResult = await otpDatabaseService.createOTP(email);
    if (!otpResult.success) {
      return res.status(500).json({ 
        success: false, 
        error: otpResult.error 
      });
    }
    
    const { otp_code: otp, ref_code } = otpResult.data;
    
    // Send email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Time AI - OTP Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Time AI - OTP Verification</h2>
          <p>Your verification code is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    });
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      expiresIn: 300, // 5 minutes in seconds
      ref_code: ref_code
    });
    
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send OTP' 
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    // Validate inputs
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and OTP code are required' 
      });
    }
    
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ 
        success: false, 
        error: 'OTP code must be 6 digits' 
      });
    }
    
    // Verify OTP using database service
    const verifyResult = await otpDatabaseService.verifyOTP(email, code);
    
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        error: verifyResult.error,
        attemptsRemaining: verifyResult.attemptsRemaining
      });
    }
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });
    
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify OTP' 
    });
  }
});

// Get OTP reference code endpoint
router.post('/get-otp-ref', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    const otpData = await otpDatabaseService.getOTPByEmail(email);
    
    if (!otpData.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active OTP found for this email' 
      });
    }
    
    res.json({ 
      success: true, 
      ref_code: otpData.data.ref_code
    });
    
  } catch (error) {
    console.error('Get OTP Ref Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get OTP reference code' 
    });
  }
});

export default router;