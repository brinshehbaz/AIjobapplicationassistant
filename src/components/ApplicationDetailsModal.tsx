import React from 'react';
import { X, Briefcase, Building, Calendar, Target, ExternalLink, Mail, FileText } from 'lucide-react';
import { JOB_STATUSES } from '../config/constants';
import type { JobApplication } from '../types';

interface ApplicationDetailsModalProps {
  application: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicationDetailsModal({ application, isOpen, onClose }: ApplicationDetailsModalProps) {
  if (!isOpen || !application) return null;

  const statusConfig = JOB_STATUSES.find(s => s.value === application.status) || JOB_STATUSES[0];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{application.jobTitle}</h2>
              <p className="text-gray-600">{application.company}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Applied: {new Date(application.applicationDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            {application.matchingScore && (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(application.matchingScore)}`}>
                  {application.matchingScore}% Match
                </span>
              </div>
            )}
          </div>

          {(application.jobUrl || application.contactEmail) && (
            <div className="flex flex-wrap gap-4">
              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Job Posting
                </a>
              )}
              {application.contactEmail && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {application.contactEmail}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{application.jobDescription}</p>
            </div>
          </div>

          {application.requirements && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{application.requirements}</p>
              </div>
            </div>
          )}

          {application.coverLetter && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cover Letter</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: application.coverLetter }}
                />
              </div>
            </div>
          )}

          {application.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{application.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}