export const GOOGLE_CONFIG = {
  CLIENT_ID: '12128787546-72h13fk4lki973f3la4da5nqvvc53lco.apps.googleusercontent.com',
  REDIRECT_URI: 'https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--96435430.local-credentialless.webcontainer-api.io/auth/callback',
  SCOPES: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose'
  ].join(' ')
};

export const GROQ_CONFIG = {
  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  MODEL: 'llama-3.1-70b-versatile'
};

export const SHEETS_CONFIG = {
  SPREADSHEET_NAME: 'Job Applications Tracker',
  HEADERS: [
    'ID',
    'Job Title',
    'Company',
    'Application Date',
    'Status',
    'Matching Score',
    'Job URL',
    'Contact Email',
    'Notes'
  ]
};

export const JOB_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' }
] as const;