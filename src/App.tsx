import React, { useState, useEffect } from 'react';
import { Bot, Settings, User, Briefcase, Key } from 'lucide-react';
import { AuthButton } from './components/AuthButton';
import { ProfileForm } from './components/ProfileForm';
import { JobApplicationForm } from './components/JobApplicationForm';
import { JobApplicationsList } from './components/JobApplicationsList';
import { GroqApiKeyModal } from './components/GroqApiKeyModal';
import { ApplicationDetailsModal } from './components/ApplicationDetailsModal';
import { googleAuthService } from './services/googleAuth';
import { googleSheetsService } from './services/googleSheets';
import { gmailService } from './services/gmail';
import { groqService } from './services/groq';
import type { User as UserType, UserProfile, JobApplication } from './types';

function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'applications'>('profile');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showGroqModal, setShowGroqModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Handle OAuth callback from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code);
      return;
    }
    
    // Check if user is already authenticated
    if (googleAuthService.isAuthenticated()) {
      loadUserData();
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Clear the URL
      window.history.replaceState({}, document.title, '/');
      
      // Use the auth service to handle the code
      const userData = await googleAuthService.handleAuthCode(code);
      setUser(userData);
    } catch (error) {
      console.error('OAuth callback failed:', error);
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadApplications();
      loadProfile();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userData = await googleAuthService.getUserInfo();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      googleAuthService.signOut();
    }
  };

  const loadProfile = () => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  };

  const loadApplications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const apps = await googleSheetsService.getJobApplications();
      setApplications(apps);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const userData = await googleAuthService.signIn();
      setUser(userData);
    } catch (error) {
      console.error('Sign in failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Set user-friendly error messages
      if (errorMessage.includes('Authentication window was closed')) {
        setAuthError('Sign-in was cancelled. Please try again.');
      } else if (errorMessage.includes('redirect_uri_mismatch')) {
        setAuthError('Configuration error. Please contact support.');
      } else if (errorMessage.includes('access_denied')) {
        setAuthError('Access denied. Please grant permission to continue.');
      } else {
        setAuthError(`Sign-in failed: ${errorMessage}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    googleAuthService.signOut();
    setUser(null);
    setProfile(null);
    setApplications([]);
    setActiveTab('profile');
  };

  const handleProfileSave = (profileData: UserProfile) => {
    setProfile(profileData);
    localStorage.setItem('user_profile', JSON.stringify(profileData));
  };

  const handleApplicationSubmit = async (applicationData: Omit<JobApplication, 'id' | 'applicationDate' | 'status'>) => {
    if (!user) return;

    setLoading(true);
    try {
      const newApplication: JobApplication = {
        ...applicationData,
        id: Date.now().toString(),
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'pending',
      };

      await googleSheetsService.addJobApplication(newApplication);
      setApplications(prev => [newApplication, ...prev]);
    } catch (error) {
      console.error('Failed to add application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: JobApplication['status']) => {
    const application = applications.find(app => app.id === id);
    if (!application) return;

    try {
      const updatedApplication = { ...application, status };
      await googleSheetsService.updateJobApplication(updatedApplication);
      setApplications(prev => prev.map(app => app.id === id ? updatedApplication : app));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      setApplications(prev => prev.filter(app => app.id !== id));
      // Note: Google Sheets API doesn't have a direct delete row method
      // In a production app, you might want to mark as deleted or rebuild the sheet
    } catch (error) {
      console.error('Failed to delete application:', error);
    }
  };

  const handleGenerateCoverLetter = async (applicationData: Omit<JobApplication, 'id' | 'applicationDate' | 'status'>) => {
    if (!profile) throw new Error('Profile not found');
    if (!groqService.getApiKey()) {
      setShowGroqModal(true);
      throw new Error('Groq API key required');
    }

    return await groqService.generateCoverLetter(profile, applicationData as JobApplication);
  };

  const handleCalculateScore = async (applicationData: Omit<JobApplication, 'id' | 'applicationDate' | 'status'>) => {
    if (!profile) throw new Error('Profile not found');
    if (!groqService.getApiKey()) {
      setShowGroqModal(true);
      throw new Error('Groq API key required');
    }

    return await groqService.calculateMatchingScore(profile, applicationData as JobApplication);
  };

  const handleSendEmail = async (application: JobApplication) => {
    if (!profile || !application.contactEmail) return;
    if (!groqService.getApiKey()) {
      setShowGroqModal(true);
      return;
    }

    try {
      setLoading(true);
      
      const coverLetter = application.coverLetter || await groqService.generateCoverLetter(profile, application);
      const emailData = await groqService.generateJobApplicationEmail(profile, application, coverLetter);

      await gmailService.sendEmail({
        to: application.contactEmail,
        subject: emailData.subject,
        body: emailData.body,
        attachments: coverLetter ? [{
          filename: 'cover-letter.html',
          content: btoa(coverLetter),
          mimeType: 'text/html'
        }] : undefined
      });

      alert('Email sent successfully!');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleGroqApiKeySave = (apiKey: string) => {
    groqService.setApiKey(apiKey);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Job Apply Agent</h1>
            <p className="text-gray-600">
              Streamline your job applications with AI-powered cover letters and automated tracking
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Google Sheets integration for application tracking
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Gmail integration for automated email sending
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              AI-powered cover letter generation
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Job matching score calculation
            </div>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-red-500 mt-0.5">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">Sign-in Error</h3>
                  <p className="text-sm text-red-700">{authError}</p>
                  {authError.includes('popups') && (
                    <p className="text-xs text-red-600 mt-2">
                      Look for a popup blocker icon in your browser's address bar and click "Always allow popups" for this site.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setAuthError(null)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <AuthButton
            user={user}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            loading={authLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AI Job Apply Agent</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowGroqModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Configure Groq API Key"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">API Key</span>
              </button>
              
              <AuthButton
                user={user}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                loading={authLoading}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Applications
              {applications.length > 0 && (
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {applications.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="space-y-8">
          {activeTab === 'profile' && (
            <ProfileForm
              profile={profile}
              onSave={handleProfileSave}
              loading={loading}
            />
          )}

          {activeTab === 'applications' && (
            <>
              <JobApplicationForm
                profile={profile}
                onSubmit={handleApplicationSubmit}
                onGenerateCoverLetter={handleGenerateCoverLetter}
                onCalculateScore={handleCalculateScore}
                loading={loading}
              />

              <JobApplicationsList
                applications={applications}
                profile={profile}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDelete}
                onSendEmail={handleSendEmail}
                onViewDetails={handleViewDetails}
                loading={loading}
              />
            </>
          )}
        </div>
      </div>

      <GroqApiKeyModal
        isOpen={showGroqModal}
        onClose={() => setShowGroqModal(false)}
        onSave={handleGroqApiKeySave}
        currentApiKey={groqService.getApiKey() || undefined}
      />

      <ApplicationDetailsModal
        application={selectedApplication}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
}

export default App;