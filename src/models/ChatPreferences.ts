import mongoose, { Document, Schema } from 'mongoose';

export interface IChatPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large';
  bubbleStyle: 'rounded' | 'square' | 'bubble';
  userAvatar: string;
  botAvatar: string;
  viewMode: 'normal' | 'mini' | 'split';
  showQuickToolbar: boolean;
  showActionSuggestions: boolean;
  soundEnabled: boolean;
  currentLanguage: string;
  position: {
    x: number;
    y: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatPreferencesSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'high-contrast'],
    default: 'light'
  },
  fontSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  bubbleStyle: {
    type: String,
    enum: ['rounded', 'square', 'bubble'],
    default: 'rounded'
  },
  userAvatar: {
    type: String,
    default: 'U'
  },
  botAvatar: {
    type: String,
    default: '🤖'
  },
  viewMode: {
    type: String,
    enum: ['normal', 'mini', 'split'],
    default: 'normal'
  },
  showQuickToolbar: {
    type: Boolean,
    default: true
  },
  showActionSuggestions: {
    type: Boolean,
    default: true
  },
  soundEnabled: {
    type: Boolean,
    default: true
  },
  currentLanguage: {
    type: String,
    default: 'en'
  },
  position: {
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

export default mongoose.model<IChatPreferences>('ChatPreferences', ChatPreferencesSchema);
