import mongoose, { Document, Schema } from 'mongoose';

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  title: string;
  messageCount: number;
  lastActivity: Date;
  isActive: boolean;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    startTime: Date;
    endTime?: Date;
    totalDuration?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat Session'
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    totalDuration: Number
  }
}, {
  timestamps: true
});

// Index for efficient querying
ChatSessionSchema.index({ userId: 1, lastActivity: -1 });
ChatSessionSchema.index({ sessionId: 1 });

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
