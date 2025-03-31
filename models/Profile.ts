import mongoose, { Schema, Document } from 'mongoose';

// Education interface
export interface IEducation {
  institution: string;
  degree: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

// Experience interface
export interface IExperience {
  company: string;
  jobTitle: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

// Profile interface
export interface IProfile extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  email: string;
  profilePicture?: string;
  resume?: string;
  skills: string[];
  education: IEducation[];
  experience: IExperience[];
  createdAt: Date;
  updatedAt: Date;
}

// Education schema
const educationSchema = new Schema<IEducation>({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String }
});

// Experience schema
const experienceSchema = new Schema<IExperience>({
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String }
});

// Profile schema
const profileSchema = new Schema<IProfile>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  profilePicture: { type: String },
  resume: { type: String },
  skills: [{ type: String }],
  education: [educationSchema],
  experience: [experienceSchema]
}, {
  timestamps: true
});

// Create or retrieve the model
export const Profile = mongoose.models.Profile || mongoose.model<IProfile>('Profile', profileSchema);
