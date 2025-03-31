'use client';

import { useState } from 'react';

interface SkillsInputProps {
  skills: string[];
  setSkills: (skills: string[]) => void;
}

export default function SkillsInput({ skills, setSkills }: SkillsInputProps) {
  const [inputValue, setInputValue] = useState('');

  // Add a new skill
  const addSkill = () => {
    const skill = inputValue.trim();
    if (!skill) return;
    
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    
    setInputValue('');
  };

  // Remove a skill
  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Handle key press (add skill on Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {skills.map((skill, index) => (
          <div 
            key={index} 
            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a skill (e.g., JavaScript, React, Node.js)"
          className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addSkill}
          className="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add
        </button>
      </div>
      
      <p className="mt-2 text-sm text-gray-500">
        Press Enter or click Add to add a skill
      </p>
    </div>
  );
}
