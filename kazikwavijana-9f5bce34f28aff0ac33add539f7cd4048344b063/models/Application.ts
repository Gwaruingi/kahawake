import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  jobId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  email: string;
  resume?: string; // Optional URL to stored resume from profile
  cv?: string; // Optional additional CV for this specific application
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'accepted';
  notes?: string; // Optional notes from the employer
  notificationRead?: boolean; // Whether the user has read the notification
  statusHistory?: Array<{
    status: string;
    date: Date;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Check if the model exists and drop it to update the schema
// This is only needed during development to update the schema
if (mongoose.models.Application) {
  delete mongoose.models.Application;
}

const applicationSchema = new Schema<IApplication>({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  resume: { 
    type: String,
    required: false // Explicitly set required to false
  },
  cv: { 
    type: String,
    required: false
  },
  coverLetter: { 
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'interview', 'hired', 'rejected', 'accepted'],
    default: 'pending'
  },
  notes: {
    type: String,
    required: false
  },
  notificationRead: {
    type: Boolean,
    default: false
  },
  statusHistory: [
    {
      status: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String,
        required: false
      }
    }
  ]
}, {
  timestamps: true
});

// Create a compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
