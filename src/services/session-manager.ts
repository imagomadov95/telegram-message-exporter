import * as fs from 'fs';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { SessionInfo } from '../models/types';
import { ISessionManager } from '../models/interfaces';

export class SessionManager implements ISessionManager {
  private readonly sessionFile: string = 'telegram_session.txt';
  private session: StringSession;
  private client: TelegramClient | null = null;

  constructor(client?: TelegramClient) {
    this.session = new StringSession('');
    this.client = client || null;
  }

  setClient(client: TelegramClient): void {
    this.client = client;
  }

  getSession(): StringSession {
    return this.session;
  }

  loadSavedSession(): boolean {
    try {
      if (fs.existsSync(this.sessionFile)) {
        const sessionString = fs.readFileSync(this.sessionFile, 'utf8').trim();
        if (sessionString) {
          console.log('Found saved session, attempting to use it...');
          this.session = new StringSession(sessionString);
          return true;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Error loading saved session:', errorMessage);
    }
    return false;
  }

  saveSession(): boolean {
    try {
      if (this.client?.session) {
        const sessionString = this.client.session.save();
        fs.writeFileSync(this.sessionFile, sessionString, 'utf8');
        console.log(`Session saved to ${this.sessionFile}`);
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving session:', errorMessage);
    }
    return false;
  }

  clearSavedSession(): void {
    try {
      if (fs.existsSync(this.sessionFile)) {
        fs.unlinkSync(this.sessionFile);
        console.log('Saved session cleared.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error clearing session:', errorMessage);
    }
  }

  getSessionInfo(): SessionInfo {
    const sessionInfo: SessionInfo = {
      filePath: this.sessionFile,
      exists: fs.existsSync(this.sessionFile)
    };

    if (sessionInfo.exists) {
      try {
        const stats = fs.statSync(this.sessionFile);
        sessionInfo.created = stats.birthtime;
        sessionInfo.modified = stats.mtime;
      } catch (error) {
        console.error('Error getting session file stats:', error);
      }
    }

    return sessionInfo;
  }

  exportSessionString(): string | null {
    try {
      if (this.client?.session) {
        return this.client.session.save();
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error exporting session:', errorMessage);
      return null;
    }
  }

  importSessionString(sessionString: string): boolean {
    try {
      if (sessionString?.trim()) {
        fs.writeFileSync(this.sessionFile, sessionString.trim(), 'utf8');
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error importing session:', errorMessage);
      return false;
    }
  }

  createNewSession(): StringSession {
    this.session = new StringSession('');
    return this.session;
  }

  async displaySessionInfo(): Promise<void> {
    console.log('\n=== Session Information ===');
    
    const sessionInfo = this.getSessionInfo();
    
    if (sessionInfo.exists) {
      console.log(`Session file: ${sessionInfo.filePath}`);
      if (sessionInfo.created) {
        console.log(`Created: ${sessionInfo.created.toLocaleString()}`);
      }
      if (sessionInfo.modified) {
        console.log(`Last modified: ${sessionInfo.modified.toLocaleString()}`);
      }
      console.log('Status: Session file exists');
    } else {
      console.log('Status: No saved session found');
    }
    
    if (this.client && await this.client.checkAuthorization()) {
      try {
        const me = await this.client.getMe();
        console.log(`\nConnected as:`);
        console.log(`Name: ${me.firstName || ''} ${me.lastName || ''}`);
        console.log(`Username: @${me.username || 'not set'}`);
        console.log(`Phone: ${me.phone || 'not available'}`);
        console.log(`ID: ${me.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Could not get user info:', errorMessage);
      }
    } else {
      console.log('\nStatus: Not currently authenticated');
    }
  }
}