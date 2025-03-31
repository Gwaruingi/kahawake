'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import EducationForm from './EducationForm';
import ExperienceForm from './ExperienceForm';
import SkillsInput from './SkillsInput';

interface Education {
  _id?: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface Experience {
  _id?: string;
  company: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface ProfileFormProps {
  initialData: any;
  onSave: (data: any) => void;
  userEmail: string;
}

export default function ProfileForm({ initialData, onSave, userEmail }: ProfileFormProps) {
  // Form state
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [resume, setResume] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<Education[]>([{ 
    institution: '', 
    degree: '', 
    startDate: '', 
    endDate: '', 
    description: '' 
  }]);
  const [experience, setExperience] = useState<Experience[]>([{ 
    company: '', 
    jobTitle: '', 
    startDate: '', 
    endDate: '', 
    description: '' 
  }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setProfilePicture(initialData.profilePicture || '');
      setResume(initialData.resume || '');
      setSkills(initialData.skills || []);
      
      if (initialData.education && initialData.education.length > 0) {
        setEducation(initialData.education.map((edu: any) => ({
          ...edu,
          startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : '',
          endDate: edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : '',
        })));
      }
      
      if (initialData.experience && initialData.experience.length > 0) {
        setExperience(initialData.experience.map((exp: any) => ({
          ...exp,
          startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
          endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
        })));
      }
    }
  }, [initialData]);

  // Handle profile picture upload
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePictureFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle resume upload
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setResumeFileName(file.name);
  };

  // Handle education changes
  const handleEducationChange = (index: number, field: string, value: string) => {
    const updatedEducation = [...education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setEducation(updatedEducation);
  };

  // Add new education entry
  const addEducation = () => {
    setEducation([...education, { 
      institution: '', 
      degree: '', 
      startDate: '', 
      endDate: '', 
      description: '' 
    }]);
  };

  // Remove education entry
  const removeEducation = (index: number) => {
    if (education.length === 1) return;
    const updatedEducation = [...education];
    updatedEducation.splice(index, 1);
    setEducation(updatedEducation);
  };

  // Handle experience changes
  const handleExperienceChange = (index: number, field: string, value: string) => {
    const updatedExperience = [...experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setExperience(updatedExperience);
  };

  // Add new experience entry
  const addExperience = () => {
    setExperience([...experience, { 
      company: '', 
      jobTitle: '', 
      startDate: '', 
      endDate: '', 
      description: '' 
    }]);
  };

  // Remove experience entry
  const removeExperience = (index: number) => {
    if (experience.length === 1) return;
    const updatedExperience = [...experience];
    updatedExperience.splice(index, 1);
    setExperience(updatedExperience);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload profile picture if changed
      let profilePicturePath = profilePicture;
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('file', profilePictureFile);
        formData.append('type', 'profilePicture');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (response.ok) {
          profilePicturePath = data.filePath;
        }
      }

      // Upload resume if changed
      let resumePath = resume;
      if (resumeFile) {
        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('type', 'resume');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (response.ok) {
          resumePath = data.filePath;
        }
      }

      // Prepare profile data
      const profileData = {
        name,
        email: userEmail,
        profilePicture: profilePicturePath,
        resume: resumePath,
        skills,
        education: education.map(edu => ({
          ...edu,
          startDate: edu.startDate ? new Date(edu.startDate) : null,
          endDate: edu.endDate ? new Date(edu.endDate) : null,
        })),
        experience: experience.map(exp => ({
          ...exp,
          startDate: exp.startDate ? new Date(exp.startDate) : null,
          endDate: exp.endDate ? new Date(exp.endDate) : null,
        })),
      };

      // Save profile
      onSave(profileData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Email (non-editable) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={userEmail}
              disabled
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
            />
          </div>
        </div>
        
        {/* Profile Picture */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Picture
          </label>
          <div className="flex items-center space-x-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100">
              {(profilePicturePreview || profilePicture) ? (
                <Image
                  src={profilePicturePreview || profilePicture}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-2xl">No Image</span>
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
              <label
                htmlFor="profilePicture"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload Photo
              </label>
            </div>
          </div>
        </div>
        
        {/* Resume Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resume (PDF/DOC/DOCX)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="resume"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              className="hidden"
            />
            <label
              htmlFor="resume"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upload Resume
            </label>
            {(resumeFileName || resume) && (
              <span className="text-sm text-gray-600">
                {resumeFileName || resume.split('/').pop()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Skills */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
        <SkillsInput skills={skills} setSkills={setSkills} />
      </div>
      
      {/* Education */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
        {education.map((edu, index) => (
          <EducationForm
            key={index}
            education={edu}
            index={index}
            onChange={handleEducationChange}
            onRemove={removeEducation}
            isRemovable={education.length > 1}
          />
        ))}
        <button
          type="button"
          onClick={addEducation}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Education
        </button>
      </div>
      
      {/* Experience */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Experience</h2>
        {experience.map((exp, index) => (
          <ExperienceForm
            key={index}
            experience={exp}
            index={index}
            onChange={handleExperienceChange}
            onRemove={removeExperience}
            isRemovable={experience.length > 1}
          />
        ))}
        <button
          type="button"
          onClick={addExperience}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Experience
        </button>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
