import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getOrCreateSession,
  saveMessage,
  getChatHistory,
  getUserSessions,
  updateMessageReaction,
  deleteSession,
  clearAllHistory
} from '../controllers/chatController.js';
import {
  getPreferences,
  updatePreferences,
  updatePosition,
  resetPreferences
} from '../controllers/chatPreferencesController.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Chat session routes
router.post('/session', getOrCreateSession);
router.get('/sessions', getUserSessions);
router.delete('/session/:sessionId', deleteSession);
router.delete('/history/clear', clearAllHistory);

// Chat message routes
router.post('/message', saveMessage);
router.get('/history/:sessionId', getChatHistory);
router.patch('/message/:messageId/reaction', updateMessageReaction);

// Chat preferences routes
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.patch('/preferences/position', updatePosition);
router.post('/preferences/reset', resetPreferences);

export default router;
