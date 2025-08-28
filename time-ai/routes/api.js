import express from 'express';
// Firebase-only implementation - All Supabase dependencies removed

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Time AI API - Firebase-only architecture',
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// Temporary response for all other endpoints during migration
router.use('*', (req, res) => {
  res.status(503).json({
    success: false,
    error: 'API temporarily disabled during Firebase-only migration',
    message: 'This endpoint is being refactored for Firebase-only implementation',
    timestamp: new Date().toISOString()
  });
});

export default router;