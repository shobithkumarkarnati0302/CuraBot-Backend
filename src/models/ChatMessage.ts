import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  messageId: string;
  type: 'user' | 'bot';
  content: string;
  language?: string;
  liked?: boolean;
  disliked?: boolean;
  confidence?: number;
  source?: 'ai' | 'knowledge_base' | 'fallback';
  suggestions?: string[];
  imageDataUrl?: string;
  aiResponse?: {
    model: string;
    tokens: number;
    processingTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  liked: {
    type: Boolean,
    default: false
  },
  disliked: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  source: {
    type: String,
    enum: ['ai', 'knowledge_base', 'fallback']
  },
  suggestions: [{
    type: String
  }],
  imageDataUrl: {
    type: String
  },
  aiResponse: {
    model: String,
    tokens: Number,
    processingTime: Number
  }
}, {
  timestamps: true
});

// Index for efficient querying
ChatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
