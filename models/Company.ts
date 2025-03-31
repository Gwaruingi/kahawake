import mongoose from 'mongoose';

export interface ICompany {
  name: string;
  email: string;
  logo: string;
  website: string;
  description: string;
  location: string;
  industry: string;
  size: string;
  foundedYear: number;
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new mongoose.Schema<ICompany>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  logo: { type: String, required: true },
  website: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  industry: { type: String, required: true },
  size: { type: String, required: true },
  foundedYear: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  userId: { 
    type: String, 
    required: true,
    ref: 'User'
  },
}, {
  timestamps: true
});

export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', companySchema);
