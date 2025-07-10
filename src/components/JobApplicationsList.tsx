import React, { useState } from 'react';
import { 
  Briefcase, 
  Building, 
  Calendar, 
  Target, 
  ExternalLink, 
  Mail, 
  Edit, 
  Trash2,
  Send,
  Eye,
  Filter
} from 'lucide-react';
import { JOB_STATUSES } from '../config/constants';
import type { JobApplication, UserProfile } from '../types';

interface JobApplicationsListProps {
  applications: JobApplication[];
  profile: UserProfile | null;
  onStatusUpdate: (id: string, status: JobApplication['status']) => void;
  onDelete: (id: string) => void;
  onSendEmail: (application: JobApplication) => void;
  onViewDetails: (application: JobApplication) => void;
  loading?: boolean;
}

export function JobApplicationsList({
  applications,
  profile,
  onStatusUpdate,
  onDelete,
  onSendEmail,
  onViewDetails,
  loading
}: JobApplicationsListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'company'>('date');

  const filteredApplications = applications
    .filter(app => filterStatus === 'all' || app.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.matchingScore || 0) - (a.matchingScore || 0);
        case 'company':
          return a.company.localeCompare(b.company);
        case 'date':
        default:
          return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
      }
    });

  const getStatusConfig = (status: JobApplication['status']) => {
    return JOB_STATUSES.find(s => s.value === status) || JOB_STATUSES[0];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {applications.length}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {JOB_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'company')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
            <option value="company">Sort by Company</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500">
              {filterStatus === 'all' 
                ? "Start by adding your first job application above."
                : `No applications with status "${JOB_STATUSES.find(s => s.value === filterStatus)?.label}".`
              }
            </p>
          </div>
        ) : (
          filteredApplications.map((application) => {
            const statusConfig = getStatusConfig(application.status);
            
            return (
              <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.jobTitle}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          {application.matchingScore && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(application.matchingScore)}`}>
                              <Target className="w-3 h-3 inline mr-1" />
                              {application.matchingScore}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {application.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(application.applicationDate).toLocaleDateString()}
                          </div>
                        </div>

                        {application.notes && (
                          <p className="text-sm text-gray-600 mb-3">{application.notes}</p>
                        )}

                        <div className="flex items-center gap-2">
                          {application.jobUrl && (
                            <a
                              href={application.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Job
                            </a>
                          )}
                          {application.contactEmail && (
                            <span className="flex items-center gap-1 text-gray-500 text-sm">
                              <Mail className="w-3 h-3" />
                              {application.contactEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={application.status}
                      onChange={(e) => onStatusUpdate(application.id, e.target.value as JobApplication['status'])}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {JOB_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => onViewDetails(application)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {application.contactEmail && profile && (
                      <button
                        onClick={() => onSendEmail(application)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(application.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}