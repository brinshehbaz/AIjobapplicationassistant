export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements: string;
  applicationDate: string;
  status: 'pending' | 'applied' | 'interview' | 'rejected' | 'accepted';
  matchingScore?: number;
  coverLetter?: string;
  notes?: string;
  jobUrl?: string;
  contactEmail?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: string;
  skills: string[];
  education: string;
  certifications?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export interface GoogleAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}