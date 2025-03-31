import React from 'react';

interface Experience {
  _id?: string;
  company: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface ExperienceFormProps {
  experience: Experience;
  index: number;
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
}

export default function ExperienceForm({ 
  experience, 
  index, 
  onChange, 
  onRemove, 
  isRemovable 
}: ExperienceFormProps) {
  return (
    <div className={`${index > 0 ? 'mt-8 pt-8 border-t border-gray-200' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company */}
        <div>
          <label 
            htmlFor={`company-${index}`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Company *
          </label>
          <input
            type="text"
            id={`company-${index}`}
            value={experience.company}
            onChange={(e) => onChange(index, 'company', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Job Title */}
        <div>
          <label 
            htmlFor={`jobTitle-${index}`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Job Title *
          </label>
          <input
            type="text"
            id={`jobTitle-${index}`}
            value={experience.jobTitle}
            onChange={(e) => onChange(index, 'jobTitle', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Start Date */}
        <div>
          <label 
            htmlFor={`expStartDate-${index}`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date *
          </label>
          <input
            type="date"
            id={`expStartDate-${index}`}
            value={experience.startDate}
            onChange={(e) => onChange(index, 'startDate', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* End Date */}
        <div>
          <label 
            htmlFor={`expEndDate-${index}`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date (leave blank if current)
          </label>
          <input
            type="date"
            id={`expEndDate-${index}`}
            value={experience.endDate || ''}
            onChange={(e) => onChange(index, 'endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Description */}
      <div className="mt-4">
        <label 
          htmlFor={`expDescription-${index}`} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id={`expDescription-${index}`}
          value={experience.description || ''}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Responsibilities, achievements, technologies used, etc."
        />
      </div>
      
      {/* Remove Button */}
      {isRemovable && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
