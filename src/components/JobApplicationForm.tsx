import React, { useState } from 'react';
import { Plus, Briefcase, Building, FileText, Link, Mail, Sparkles, Target } from 'lucide-react';
import type { JobApplication, UserProfile } from '../types';

interface JobApplicationFormProps {
  profile: UserProfile | null;
  onSubmit: (application: Omit<JobApplication, 'id' | 'applicationDate' | 'status'>) => void;
  onGenerateCoverLetter: (application: Omit<JobApplication, 'id' | 'applicationDate' | 'status'>) => Promise<string>;
  onCalculateScore: (application: Omit<JobApplication, 'id' | 'applicationDate' | 'status'>) => Promise<number>;
  loading?: boolean;
}

export function JobApplicationForm({ 
  profile, 
  onSubmit, 
  onGenerateCoverLetter, 
  onCalculateScore, 
  loading 
}: JobApplicationFormProps) {
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
    requirements: '',
    jobUrl: '',
    contactEmail: '',
    notes: '',
  });

  const [coverLetter, setCoverLetter] = useState('');
  const [matchingScore, setMatchingScore] = useState<number | undefined>();
  const [generating, setGenerating] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      coverLetter: coverLetter || undefined,
      matchingScore,
    });
    
    // Reset form
    setFormData({
      jobTitle: '',
      company: '',
      jobDescription: '',
      requirements: '',
      jobUrl: '',
      contactEmail: '',
      notes: '',
    });
    setCoverLetter('');
    setMatchingScore(undefined);
  };

  const handleGenerateCoverLetter = async () => {
    if (!profile) return;
    
    setGenerating(true);
    try {
      const generated = await onGenerateCoverLetter(formData);
      setCoverLetter(generated);
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCalculateScore = async () => {
    if (!profile) return;
    
    setCalculating(true);
    try {
      const score = await onCalculateScore(formData);
      setMatchingScore(score);
    } catch (error) {
      console.error('Failed to calculate matching score:', error);
    } finally {
      setCalculating(false);
    }
  };

  const isFormValid = formData.jobTitle && formData.company && formData.jobDescription;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Plus className="w-5 h-5 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Add New Job Application</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4" />
              Job Title *
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4" />
              Company *
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4" />
            Job Description *
          </label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Paste the job description here..."
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4" />
            Requirements
          </label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="List the key requirements and qualifications..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Link className="w-4 h-4" />
              Job URL
            </label>
            <input
              type="url"
              value={formData.jobUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, jobUrl: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4" />
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="recruiter@company.com"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4" />
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Additional notes about this application..."
          />
        </div>

        {profile && isFormValid && (
          <div className="border-t pt-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCalculateScore}
                disabled={calculating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:bg-purple-50 disabled:text-purple-400 rounded-lg transition-colors"
              >
                {calculating ? (
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                Calculate Match Score
              </button>

              <button
                type="button"
                onClick={handleGenerateCoverLetter}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-blue-50 disabled:text-blue-400 rounded-lg transition-colors"
              >
                {generating ? (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate Cover Letter
              </button>
            </div>

            {matchingScore !== undefined && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Matching Score</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-purple-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${matchingScore}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-purple-900">{matchingScore}%</span>
                </div>
              </div>
            )}

            {coverLetter && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Generated Cover Letter</span>
                </div>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: coverLetter }}
                />
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-colors font-medium"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add Application
        </button>
      </form>
    </div>
  );
}