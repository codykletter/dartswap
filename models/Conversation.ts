import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';
import { IListing } from './Listing';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[] | IUser[];
  listing?: mongoose.Types.ObjectId | IListing;
  lastMessage?: string;
  lastMessageAt: Date;
  unreadCounts: Map<string, number>;
}

const ConversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
  },
  lastMessage: {
    type: String,
    trim: true,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map(),
  },
});

// Validate that there are exactly 2 participants
ConversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error('A conversation must have exactly 2 participants'));
  } else {
    next();
  }
});

// Index for finding conversations by participants
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

const Conversation: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;