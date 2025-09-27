import { Request, Response } from 'express';
import ChatPreferences from '../models/ChatPreferences.js';

// Get user chat preferences
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;

    let preferences = await ChatPreferences.findOne({ userId });

    if (!preferences) {
      // Create default preferences if none exist
      preferences = new ChatPreferences({
        userId,
        theme: 'light',
        fontSize: 'medium',
        bubbleStyle: 'rounded',
        userAvatar: 'U',
        botAvatar: '🤖',
        viewMode: 'normal',
        showQuickToolbar: true,
        showActionSuggestions: true,
        soundEnabled: true,
        currentLanguage: 'en',
        position: { x: 0, y: 0 }
      });
      await preferences.save();
    }

    res.status(200).json({
      success: true,
      preferences: {
        theme: preferences.theme,
        fontSize: preferences.fontSize,
        bubbleStyle: preferences.bubbleStyle,
        userAvatar: preferences.userAvatar,
        botAvatar: preferences.botAvatar,
        viewMode: preferences.viewMode,
        showQuickToolbar: preferences.showQuickToolbar,
        showActionSuggestions: preferences.showActionSuggestions,
        soundEnabled: preferences.soundEnabled,
        currentLanguage: preferences.currentLanguage,
        position: preferences.position
      }
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to get preferences' });
  }
};

// Update user chat preferences
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const updateData = req.body;

    // Validate enum values
    const validThemes = ['light', 'dark', 'high-contrast'];
    const validFontSizes = ['small', 'medium', 'large'];
    const validBubbleStyles = ['rounded', 'square', 'bubble'];
    const validViewModes = ['normal', 'mini', 'split'];

    if (updateData.theme && !validThemes.includes(updateData.theme)) {
      return res.status(400).json({ success: false, message: 'Invalid theme value' });
    }

    if (updateData.fontSize && !validFontSizes.includes(updateData.fontSize)) {
      return res.status(400).json({ success: false, message: 'Invalid fontSize value' });
    }

    if (updateData.bubbleStyle && !validBubbleStyles.includes(updateData.bubbleStyle)) {
      return res.status(400).json({ success: false, message: 'Invalid bubbleStyle value' });
    }

    if (updateData.viewMode && !validViewModes.includes(updateData.viewMode)) {
      return res.status(400).json({ success: false, message: 'Invalid viewMode value' });
    }

    const preferences = await ChatPreferences.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        theme: preferences.theme,
        fontSize: preferences.fontSize,
        bubbleStyle: preferences.bubbleStyle,
        userAvatar: preferences.userAvatar,
        botAvatar: preferences.botAvatar,
        viewMode: preferences.viewMode,
        showQuickToolbar: preferences.showQuickToolbar,
        showActionSuggestions: preferences.showActionSuggestions,
        soundEnabled: preferences.soundEnabled,
        currentLanguage: preferences.currentLanguage,
        position: preferences.position
      }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
};

// Update chatbot position
export const updatePosition = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { x, y } = req.body;

    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid position values' });
    }

    await ChatPreferences.findOneAndUpdate(
      { userId },
      { $set: { position: { x, y } } },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Position updated successfully'
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ success: false, message: 'Failed to update position' });
  }
};

// Reset preferences to default
export const resetPreferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;

    const defaultPreferences = {
      theme: 'light',
      fontSize: 'medium',
      bubbleStyle: 'rounded',
      userAvatar: 'U',
      botAvatar: '🤖',
      viewMode: 'normal',
      showQuickToolbar: true,
      showActionSuggestions: true,
      soundEnabled: true,
      currentLanguage: 'en',
      position: { x: 0, y: 0 }
    };

    const preferences = await ChatPreferences.findOneAndUpdate(
      { userId },
      { $set: defaultPreferences },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Preferences reset to default',
      preferences: defaultPreferences
    });
  } catch (error) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to reset preferences' });
  }
};
