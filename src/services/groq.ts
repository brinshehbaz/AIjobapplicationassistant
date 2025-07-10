import { GROQ_CONFIG } from '../config/constants';
import type { GroqResponse, UserProfile, JobApplication } from '../types';

class GroqService {
  private apiKey: string | null = null;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    localStorage.setItem('groq_api_key', apiKey);
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('groq_api_key');
    }
    return this.apiKey;
  }

  async generateCoverLetter(
    userProfile: UserProfile,
    jobApplication: JobApplication
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompt = `Generate a professional cover letter for the following job application:

Job Title: ${jobApplication.jobTitle}
Company: ${jobApplication.company}
Job Description: ${jobApplication.jobDescription}
Requirements: ${jobApplication.requirements}

Candidate Profile:
Name: ${userProfile.name}
Summary: ${userProfile.summary}
Experience: ${userProfile.experience}
Skills: ${userProfile.skills.join(', ')}
Education: ${userProfile.education}

Please write a compelling, personalized cover letter that:
1. Addresses the specific job requirements
2. Highlights relevant experience and skills
3. Shows enthusiasm for the role and company
4. Maintains a professional tone
5. Is concise but impactful (3-4 paragraphs)

Format the letter as HTML with proper paragraph tags for email sending.`;

    const response = await this.makeGroqRequest([
      {
        role: 'system',
        content: 'You are a professional career coach and expert cover letter writer. Generate compelling, personalized cover letters that help candidates stand out.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    return response.choices[0].message.content;
  }

  async calculateMatchingScore(
    userProfile: UserProfile,
    jobApplication: JobApplication
  ): Promise<number> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompt = `Analyze the match between this candidate and job posting. Return ONLY a number between 0-100 representing the matching percentage.

Job Title: ${jobApplication.jobTitle}
Company: ${jobApplication.company}
Job Description: ${jobApplication.jobDescription}
Requirements: ${jobApplication.requirements}

Candidate Profile:
Summary: ${userProfile.summary}
Experience: ${userProfile.experience}
Skills: ${userProfile.skills.join(', ')}
Education: ${userProfile.education}

Consider:
- Skill alignment with requirements
- Experience relevance
- Education match
- Overall fit for the role

Return only the numerical score (0-100), no explanation.`;

    const response = await this.makeGroqRequest([
      {
        role: 'system',
        content: 'You are an expert recruiter and talent matcher. Analyze candidate-job fit and provide accurate matching scores.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    const scoreText = response.choices[0].message.content.trim();
    const score = parseInt(scoreText.match(/\d+/)?.[0] || '0');
    return Math.min(Math.max(score, 0), 100);
  }

  async generateJobApplicationEmail(
    userProfile: UserProfile,
    jobApplication: JobApplication,
    coverLetter: string
  ): Promise<{ subject: string; body: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompt = `Generate a professional job application email for:

Job Title: ${jobApplication.jobTitle}
Company: ${jobApplication.company}
Candidate: ${userProfile.name}

The email should:
1. Have a compelling subject line
2. Include a brief introduction
3. Reference the cover letter (attached)
4. Express enthusiasm
5. Include a professional closing

Return the response in JSON format:
{
  "subject": "Email subject line",
  "body": "HTML formatted email body"
}`;

    const response = await this.makeGroqRequest([
      {
        role: 'system',
        content: 'You are a professional career coach. Generate effective job application emails in JSON format.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    try {
      const result = JSON.parse(response.choices[0].message.content);
      return {
        subject: result.subject,
        body: result.body
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        subject: `Application for ${jobApplication.jobTitle} Position`,
        body: `<p>Dear Hiring Manager,</p>
               <p>I am writing to express my interest in the ${jobApplication.jobTitle} position at ${jobApplication.company}.</p>
               <p>Please find my cover letter attached for your review.</p>
               <p>Thank you for your consideration.</p>
               <p>Best regards,<br>${userProfile.name}</p>`
      };
    }
  }

  private async makeGroqRequest(messages: Array<{ role: string; content: string }>): Promise<GroqResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const response = await fetch(GROQ_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_CONFIG.MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }
}

export const groqService = new GroqService();