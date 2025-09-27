import { Request, Response } from 'express';
import ChatMessage from '../models/ChatMessage.js';
import ChatSession from '../models/ChatSession.js';
import ChatPreferences from '../models/ChatPreferences.js';
import crypto from 'crypto';

// Get or create chat session
export const getOrCreateSession = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { sessionId } = req.body;

    let session;
    
    if (sessionId) {
      session = await ChatSession.findOne({ sessionId, userId });
    }
    
    if (!session) {
      const newSessionId = crypto.randomUUID();
      session = new ChatSession({
        userId,
        sessionId: newSessionId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        metadata: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          startTime: new Date()
        }
      });
      await session.save();
    }

    res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        title: session.title,
        messageCount: session.messageCount,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('Error getting/creating session:', error);
    res.status(500).json({ success: false, message: 'Failed to get session' });
  }
};

// Save chat message
export const saveMessage = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { 
      sessionId, 
      messageId, 
      type, 
      content, 
      language, 
      confidence, 
      source, 
      suggestions, 
      imageDataUrl,
      aiResponse 
    } = req.body;

    const message = new ChatMessage({
      userId,
      sessionId,
      messageId,
      type,
      content,
      language,
      confidence,
      source,
      suggestions,
      imageDataUrl,
      aiResponse
    });

    await message.save();

    // Update session message count and last activity
    await ChatSession.findOneAndUpdate(
      { sessionId, userId },
      { 
        $inc: { messageCount: 1 },
        lastActivity: new Date()
      }
    );

    res.status(201).json({
      success: true,
      message: 'Message saved successfully',
      messageId: message.messageId
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, message: 'Failed to save message' });
  }
};

// Get chat history
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await ChatMessage.find({ userId, sessionId })
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const totalMessages = await ChatMessage.countDocuments({ userId, sessionId });

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ success: false, message: 'Failed to get chat history' });
  }
};

// Get all user sessions
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { page = 1, limit = 20 } = req.query;

    const sessions = await ChatSession.find({ userId })
      .sort({ lastActivity: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('sessionId title messageCount lastActivity isActive createdAt')
      .lean();

    const totalSessions = await ChatSession.countDocuments({ userId });

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to get sessions' });
  }
};

// Update message reaction (like/dislike)
export const updateMessageReaction = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { messageId } = req.params;
    const { liked, disliked } = req.body;

    const message = await ChatMessage.findOneAndUpdate(
      { messageId, userId },
      { liked, disliked },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Reaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating message reaction:', error);
    res.status(500).json({ success: false, message: 'Failed to update reaction' });
  }
};

// Delete chat session
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { sessionId } = req.params;

    // Delete all messages in the session
    await ChatMessage.deleteMany({ userId, sessionId });
    
    // Delete the session
    await ChatSession.deleteOne({ userId, sessionId });

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
};

// Clear all chat history for user
export const clearAllHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;

    await ChatMessage.deleteMany({ userId });
    await ChatSession.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: 'All chat history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
};
