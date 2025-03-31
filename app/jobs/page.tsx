'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Salary {
  min: number;
  max: number;
  currency: string;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  companyName?: string;
  location: string;
  description: string;
  requirements: string[];
  salary: Salary;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  jobType?: string;
  status: 'active' | 'closed';
  createdAt: string;
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    company: '',
    type: '',
    status: 'active'
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data: JobsResponse = await response.json();
        setJobs(data.jobs || []);
      } catch (err) {
        setError('Error loading jobs. Please try again later.');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    return (
      (filter.company === '' || job.company === filter.company || job.companyName === filter.company) &&
      (filter.type === '' || job.type === filter.type || job.jobType === filter.type) &&
      (filter.status === '' || job.status === filter.status)
    );
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Job Listings</h1>
        <div className="animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 p-6 rounded-lg mb-4 h-40"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Job Listings</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Get unique companies and job types for filters
  const companies = Array.from(new Set(jobs.map(job => job.company || job.companyName))).filter(Boolean);
  const jobTypes = Array.from(new Set(jobs.map(job => job.type || job.jobType))).filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Job Listings</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <select
            id="company"
            name="company"
            value={filter.company}
            onChange={handleFilterChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Job Type
          </label>
          <select
            id="type"
            name="type"
            value={filter.type}
            onChange={handleFilterChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {jobTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filter.status}
            onChange={handleFilterChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      
      {/* Job listings */}
      {filteredJobs.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No jobs found matching your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <div key={job._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <p className="text-gray-600">{job.company || job.companyName}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                  <span className="inline-block ml-2 px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                    {job.type || job.jobType}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
              
              <div className="flex justify-between items-center">
                <p className="text-gray-600">{job.location}</p>
                <Link
                  href={`/jobs/${job._id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
