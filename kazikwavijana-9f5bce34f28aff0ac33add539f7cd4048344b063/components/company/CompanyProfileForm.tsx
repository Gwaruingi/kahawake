'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  logo: z.string().url('Logo must be a valid URL'),
  website: z.string().url('Website must be a valid URL'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  location: z.string().min(2, 'Location is required'),
  industry: z.string().min(2, 'Industry is required'),
  size: z.string().min(2, 'Company size is required'),
  foundedYear: z.number()
    .min(1800, 'Founded year must be after 1800')
    .max(new Date().getFullYear(), 'Founded year cannot be in the future'),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setLoading(true);

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create company profile');
      }

      toast.success('Company profile submitted for review');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-100 employees',
    '101-500 employees',
    '501-1000 employees',
    '1000+ employees',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="TechCorp"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Company Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="hr@techcorp.com"
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Company Logo URL</Label>
        <Input
          id="logo"
          {...register('logo')}
          placeholder="https://example.com/logo.png"
        />
        {errors.logo && (
          <p className="text-sm text-red-500">{errors.logo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Company Website</Label>
        <Input
          id="website"
          {...register('website')}
          placeholder="https://techcorp.example.com"
        />
        {errors.website && (
          <p className="text-sm text-red-500">{errors.website.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Company Description</Label>
        <textarea
          id="description"
          {...register('description')}
          className="w-full min-h-[100px] p-2 border rounded-md"
          placeholder="A leading technology company specializing in software development and IT services"
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          {...register('location')}
          placeholder="Nairobi, Kenya"
        />
        {errors.location && (
          <p className="text-sm text-red-500">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          {...register('industry')}
          placeholder="Technology"
        />
        {errors.industry && (
          <p className="text-sm text-red-500">{errors.industry.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="size">Company Size</Label>
        <select
          id="size"
          {...register('size')}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select company size</option>
          {companySizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        {errors.size && (
          <p className="text-sm text-red-500">{errors.size.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="foundedYear">Founded Year</Label>
        <Input
          id="foundedYear"
          type="number"
          {...register('foundedYear', { valueAsNumber: true })}
          placeholder="2010"
        />
        {errors.foundedYear && (
          <p className="text-sm text-red-500">{errors.foundedYear.message}</p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <LoadingSpinner /> : 'Submit Company Profile'}
      </Button>
    </form>
  );
}
