'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/LoadingSpinner';
import { XCircleIcon, PlusCircleIcon } from '@heroicons/react/24/solid';

// Job posting validation schema
const JobPostingSchema = Yup.object().shape({
  title: Yup.string()
    .min(5, 'Job title must be at least 5 characters')
    .required('Job title is required'),
  jobType: Yup.string()
    .oneOf(['Full-time', 'Part-time', 'Contract', 'Remote'], 'Invalid job type')
    .required('Job type is required'),
  location: Yup.string()
    .required('Location is required'),
  salary: Yup.string(),
  description: Yup.string()
    .min(100, 'Description must be at least 100 characters')
    .required('Job description is required'),
  responsibilities: Yup.array()
    .of(Yup.string().required('Responsibility cannot be empty'))
    .min(1, 'At least one responsibility is required'),
  requirements: Yup.array()
    .of(Yup.string().required('Requirement cannot be empty'))
    .min(1, 'At least one requirement is required'),
  applicationDeadline: Yup.date()
    .min(new Date(), 'Application deadline cannot be in the past')
    .required('Application deadline is required'),
});

// Initial values for the form
const initialValues = {
  title: '',
  jobType: '',
  location: '',
  salary: '',
  description: '',
  responsibilities: [''],
  requirements: [''],
  applicationDeadline: '',
};

interface JobPostingFormProps {
  job?: any;
}

export default function JobPostingForm({ job }: JobPostingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [formValues, setFormValues] = useState(initialValues);
  const isEditMode = !!job;

  useEffect(() => {
    if (job) {
      // Format the job data for the form
      const formattedJob = {
        ...job,
        // Format date for the date input (YYYY-MM-DD)
        applicationDeadline: new Date(job.applicationDeadline).toISOString().split('T')[0],
        // Ensure responsibilities and requirements are arrays
        responsibilities: Array.isArray(job.responsibilities) 
          ? job.responsibilities 
          : [''],
        requirements: Array.isArray(job.requirements) 
          ? job.requirements 
          : [''],
      };
      
      setFormValues(formattedJob);
    }
  }, [job]);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setLoading(true);

      // Format the date properly
      const formattedValues = {
        ...values,
        applicationDeadline: new Date(values.applicationDeadline).toISOString(),
        // Set apply method to internal
        applyMethod: {
          type: 'internal'
        }
      };

      const url = isEditMode ? `/api/jobs/${job._id}` : '/api/jobs';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'post'} job`);
      }

      toast({
        title: "Success!",
        message: isEditMode 
          ? "Your job has been updated successfully." 
          : "Your job has been posted successfully.",
        type: "success",
      });

      // Redirect to company jobs page
      router.push('/company/jobs');
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        message: error.message || `Failed to ${isEditMode ? 'update' : 'post'} job`,
        type: "error",
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handlePreview = (values: any) => {
    setPreviewData({
      ...values,
      applyMethod: { type: 'internal' }
    });
    setPreviewMode(true);
  };

  const exitPreview = () => {
    setPreviewMode(false);
    setPreviewData(null);
  };

  if (previewMode && previewData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Job Preview</h2>
          <Button variant="outline" onClick={exitPreview}>
            Exit Preview
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">{previewData.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {previewData.jobType}
              </span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {previewData.location}
              </span>
              {previewData.salary && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {previewData.salary}
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Job Description</h3>
            <p className="whitespace-pre-line">{previewData.description}</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-1">
              {previewData.responsibilities.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Requirements</h3>
            <ul className="list-disc pl-5 space-y-1">
              {previewData.requirements.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">How to Apply</h3>
            <p>Candidates can apply directly through our job portal. They will need to sign in and complete the application form.</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Application Deadline</h3>
            <p>{new Date(previewData.applicationDeadline).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="outline" className="mr-2" onClick={exitPreview}>
            Edit Job
          </Button>
          <Button onClick={() => handleSubmit(previewData, { setSubmitting: () => {} })}>
            {loading ? <LoadingSpinner /> : isEditMode ? 'Update Job' : 'Post Job'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Job Posting' : 'Post a New Job'}</h2>
      
      <Formik
        initialValues={formValues}
        validationSchema={JobPostingSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, isSubmitting, isValid, dirty }) => (
          <Form className="space-y-6">
            {/* Job Title */}
            <div>
              <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
              <Field
                as={Input}
                id="title"
                name="title"
                placeholder="e.g. Senior Software Engineer"
                className={`w-full ${errors.title && touched.title ? 'border-red-500' : ''}`}
              />
              <ErrorMessage name="title" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* Job Type */}
            <div>
              <Label htmlFor="jobType">Job Type <span className="text-red-500">*</span></Label>
              <Field
                as="select"
                id="jobType"
                name="jobType"
                className={`w-full p-2 border rounded-md ${errors.jobType && touched.jobType ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Job Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </Field>
              <ErrorMessage name="jobType" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <Field
                as={Input}
                id="location"
                name="location"
                placeholder="e.g. New York, NY or Remote"
                className={`w-full ${errors.location && touched.location ? 'border-red-500' : ''}`}
              />
              <ErrorMessage name="location" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* Salary Range */}
            <div>
              <Label htmlFor="salary">Salary Range (Optional)</Label>
              <Field
                as={Input}
                id="salary"
                name="salary"
                placeholder="e.g. $60,000 - $80,000/year"
                className="w-full"
              />
              <ErrorMessage name="salary" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* Job Description */}
            <div>
              <Label htmlFor="description">Job Description <span className="text-red-500">*</span></Label>
              <Field
                as={Textarea}
                id="description"
                name="description"
                rows={6}
                placeholder="Provide a detailed description of the job role..."
                className={`w-full ${errors.description && touched.description ? 'border-red-500' : ''}`}
              />
              <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* Responsibilities */}
            <div>
              <Label>Responsibilities <span className="text-red-500">*</span></Label>
              <FieldArray name="responsibilities">
                {({ remove, push }) => (
                  <div className="space-y-2">
                    {values.responsibilities.map((responsibility, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Field
                          as={Input}
                          name={`responsibilities.${index}`}
                          placeholder="Add a responsibility"
                          className={`w-full ${
                            errors.responsibilities?.[index] && touched.responsibilities?.[index]
                              ? 'border-red-500'
                              : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (values.responsibilities.length > 1) {
                              remove(index);
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => push('')}
                      className="flex items-center text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <PlusCircleIcon className="h-5 w-5 mr-1" />
                      Add Responsibility
                    </button>
                    {typeof errors.responsibilities === 'string' && (
                      <div className="text-red-500 text-sm">{errors.responsibilities}</div>
                    )}
                  </div>
                )}
              </FieldArray>
            </div>

            {/* Requirements */}
            <div>
              <Label>Requirements & Qualifications <span className="text-red-500">*</span></Label>
              <FieldArray name="requirements">
                {({ remove, push }) => (
                  <div className="space-y-2">
                    {values.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Field
                          as={Input}
                          name={`requirements.${index}`}
                          placeholder="Add a requirement"
                          className={`w-full ${
                            errors.requirements?.[index] && touched.requirements?.[index]
                              ? 'border-red-500'
                              : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (values.requirements.length > 1) {
                              remove(index);
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => push('')}
                      className="flex items-center text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <PlusCircleIcon className="h-5 w-5 mr-1" />
                      Add Requirement
                    </button>
                    {typeof errors.requirements === 'string' && (
                      <div className="text-red-500 text-sm">{errors.requirements}</div>
                    )}
                  </div>
                )}
              </FieldArray>
            </div>

            {/* Application Deadline */}
            <div>
              <Label htmlFor="applicationDeadline">Application Deadline <span className="text-red-500">*</span></Label>
              <Field
                as={Input}
                type="date"
                id="applicationDeadline"
                name="applicationDeadline"
                min={new Date().toISOString().split('T')[0]}
                className={`w-full ${errors.applicationDeadline && touched.applicationDeadline ? 'border-red-500' : ''}`}
              />
              <ErrorMessage name="applicationDeadline" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* How to Apply - Note */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-md font-medium text-blue-800 mb-2">How to Apply</h3>
              <p className="text-sm text-blue-700">
                All applications will be processed through our internal job portal. Candidates will need to sign in and complete the application form.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePreview(values)}
                disabled={!isValid || isSubmitting}
              >
                Preview Job
              </Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {loading ? <LoadingSpinner /> : isEditMode ? 'Update Job' : 'Post Job'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
