import { googleAuthService } from './googleAuth';

interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string;
    mimeType: string;
  }>;
}

class GmailService {
  async sendEmail(emailData: EmailData): Promise<void> {
    const token = await googleAuthService.getValidAccessToken();
    
    const email = this.createEmailMessage(emailData);
    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send email: ${error.error?.message || 'Unknown error'}`);
    }
  }

  private createEmailMessage(emailData: EmailData): string {
    const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9);
    
    let email = [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      emailData.body,
    ].join('\r\n');

    if (emailData.attachments) {
      for (const attachment of emailData.attachments) {
        email += [
          '',
          `--${boundary}`,
          `Content-Type: ${attachment.mimeType}`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          '',
          attachment.content,
        ].join('\r\n');
      }
    }

    email += `\r\n--${boundary}--`;
    return email;
  }

  async createDraft(emailData: EmailData): Promise<string> {
    const token = await googleAuthService.getValidAccessToken();
    
    const email = this.createEmailMessage(emailData);
    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          raw: encodedEmail,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create draft: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.id;
  }
}

export const gmailService = new GmailService();