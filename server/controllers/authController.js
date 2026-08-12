// server/controllers/authController.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const googleLogin = async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user payload received.',
      });
    }

    // 🔒 ACCESS CONTROL GUARD
    const allowedEmails = (process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length > 0 && !allowedEmails.includes(email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: ${email} is not authorized to access Shree Sai Tyres.`,
      });
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, email, name, picture });
    } else {
      user.name = name;
      user.picture = picture;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret_fallback',
      { expiresIn: '30d' }
    );

    return res.status(200).json({ success: true, result: user, token });
  } catch (error) {
    console.error('Auth Controller Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Authentication failed',
    });
  }
};