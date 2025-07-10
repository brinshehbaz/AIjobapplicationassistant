import { googleAuthService } from './googleAuth';
import { SHEETS_CONFIG } from '../config/constants';
import type { JobApplication } from '../types';

class GoogleSheetsService {
  private spreadsheetId: string | null = null;

  async createOrGetSpreadsheet(): Promise<string> {
    if (this.spreadsheetId) {
      return this.spreadsheetId;
    }

    const token = await googleAuthService.getValidAccessToken();
    
    // Try to find existing spreadsheet
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${SHEETS_CONFIG.SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const searchData = await searchResponse.json();
    
    if (searchData.files && searchData.files.length > 0) {
      this.spreadsheetId = searchData.files[0].id;
      return this.spreadsheetId;
    }

    // Create new spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: SHEETS_CONFIG.SPREADSHEET_NAME,
        },
        sheets: [{
          properties: {
            title: 'Applications',
          },
        }],
      }),
    });

    const createData = await createResponse.json();
    this.spreadsheetId = createData.spreadsheetId;

    // Add headers
    await this.updateRange('A1:I1', [SHEETS_CONFIG.HEADERS]);

    return this.spreadsheetId;
  }

  async addJobApplication(application: JobApplication): Promise<void> {
    const spreadsheetId = await this.createOrGetSpreadsheet();
    const values = [
      [
        application.id,
        application.jobTitle,
        application.company,
        application.applicationDate,
        application.status,
        application.matchingScore?.toString() || '',
        application.jobUrl || '',
        application.contactEmail || '',
        application.notes || '',
      ],
    ];

    await this.appendValues(values);
  }

  async updateJobApplication(application: JobApplication): Promise<void> {
    const applications = await this.getJobApplications();
    const rowIndex = applications.findIndex(app => app.id === application.id);
    
    if (rowIndex === -1) {
      throw new Error('Application not found');
    }

    const range = `A${rowIndex + 2}:I${rowIndex + 2}`;
    const values = [
      [
        application.id,
        application.jobTitle,
        application.company,
        application.applicationDate,
        application.status,
        application.matchingScore?.toString() || '',
        application.jobUrl || '',
        application.contactEmail || '',
        application.notes || '',
      ],
    ];

    await this.updateRange(range, values);
  }

  async getJobApplications(): Promise<JobApplication[]> {
    const spreadsheetId = await this.createOrGetSpreadsheet();
    const token = await googleAuthService.getValidAccessToken();

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:I1000`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    
    if (!data.values) {
      return [];
    }

    return data.values.map((row: string[]) => ({
      id: row[0] || '',
      jobTitle: row[1] || '',
      company: row[2] || '',
      applicationDate: row[3] || '',
      status: (row[4] as JobApplication['status']) || 'pending',
      matchingScore: row[5] ? parseInt(row[5]) : undefined,
      jobUrl: row[6] || '',
      contactEmail: row[7] || '',
      notes: row[8] || '',
    }));
  }

  private async updateRange(range: string, values: string[][]): Promise<void> {
    const spreadsheetId = await this.createOrGetSpreadsheet();
    const token = await googleAuthService.getValidAccessToken();

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
        }),
      }
    );
  }

  private async appendValues(values: string[][]): Promise<void> {
    const spreadsheetId = await this.createOrGetSpreadsheet();
    const token = await googleAuthService.getValidAccessToken();

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:I:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
        }),
      }
    );
  }
}

export const googleSheetsService = new GoogleSheetsService();