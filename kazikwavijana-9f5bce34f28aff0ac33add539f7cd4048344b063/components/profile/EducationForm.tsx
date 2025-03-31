import React from 'react';

interface Education {
  _id?: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface EducationFormProps {
  education: Education;
  index: number;
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
}

export default function EducationForm({ 
  education, 
  index, 
  onChange, 
  onRemove, 
  isRemovable 
}: EducationFormProps) {
  return (
    <div className={`${index > 0 ? 'mt-8 pt-8 border-t border-gray-200' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institution */}
        <div>
          <label 
            htmlFor={`institution-${index}`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Institution *
          </label>
          <input
            type="text"
            id={`institution-${index}`}
            value={education.institution}
            onChange={(e) => onChange(index, 'institution', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Degree */}
        <div>
          <label 
            htmlFor={`degree-${index}`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Degree/Certification *
          </label>
          <input
            type="text"
            id={`degree-${index}`}
            value={education.degree}
            onChange={(e) => onChange(index, 'degree', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Start Date */}
        <div>
          <label 
            htmlFor={`startDate-${index}`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date *
          </label>
          <input
            type="date"
            id={`startDate-${index}`}
            value={education.startDate}
            onChange={(e) => onChange(index, 'startDate', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* End Date */}
        <div>
          <label 
            htmlFor={`endDate-${index}`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date (or expected)
          </label>
          <input
            type="date"
            id={`endDate-${index}`}
            value={education.endDate || ''}
            onChange={(e) => onChange(index, 'endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Description */}
      <div className="mt-4">
        <label 
          htmlFor={`description-${index}`} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id={`description-${index}`}
          value={education.description || ''}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Relevant coursework, achievements, etc."
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
