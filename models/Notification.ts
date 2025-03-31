import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  type: 'application_status' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  relatedId?: mongoose.Schema.Types.ObjectId; // Optional reference to related document (e.g., application)
  createdAt: Date;
  updatedAt: Date;
}

// Check if the model exists and drop it to update the schema
// This is only needed during development to update the schema
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['application_status', 'message', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  }
}, {
  timestamps: true
});

// Create an index for faster querying by userId
notificationSchema.index({ userId: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
