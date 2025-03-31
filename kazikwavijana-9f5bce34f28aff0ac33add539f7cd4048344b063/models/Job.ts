import mongoose from 'mongoose';

export interface IJob {
  title: string;
  companyId: string;
  companyName: string;
  jobType: string;
  location: string;
  salary?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  applyMethod: {
    type: string;
    email?: string;
    applyLink?: string;
  };
  applicationDeadline: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Check if the model exists and delete it to update the schema
// This is only needed during development to update the schema
if (mongoose.models.Job) {
  delete mongoose.models.Job;
}

const jobSchema = new mongoose.Schema<IJob>({
  title: { type: String, required: true },
  companyId: { 
    type: String, 
    required: true,
    ref: 'Company'
  },
  companyName: { type: String, required: true },
  jobType: { 
    type: String, 
    enum: ['Full-time', 'Part-time', 'Contract', 'Remote'], 
    required: true 
  },
  location: { type: String, required: true },
  salary: { type: String },
  description: { type: String, required: true },
  responsibilities: [{ type: String, required: true }],
  requirements: [{ type: String, required: true }],
  applyMethod: {
    type: { 
      type: String, 
      enum: ['email', 'link', 'internal'], 
      required: true 
    },
    email: { type: String },
    applyLink: { type: String }
  },
  applicationDeadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add validation for applyMethod
jobSchema.pre('validate', function(next) {
  if (this.applyMethod.type === 'email' && !this.applyMethod.email) {
    this.invalidate('applyMethod.email', 'Email is required when application method is email');
  }
  
  if (this.applyMethod.type === 'link' && !this.applyMethod.applyLink) {
    this.invalidate('applyMethod.applyLink', 'Application link is required when application method is link');
  }
  
  next();
});

export const Job = mongoose.model<IJob>('Job', jobSchema);
