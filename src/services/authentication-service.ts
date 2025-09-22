import * as input from 'input';
import { TelegramClient } from 'telegram';
import { AuthenticationCredentials } from '../models/types';
import { IAuthenticationService } from '../models/interfaces';
import { SessionManager } from './session-manager';

export class AuthenticationService implements IAuthenticationService {
  private client: TelegramClient;
  private sessionManager: SessionManager;

  constructor(client: TelegramClient, sessionManager: SessionManager) {
    this.client = client;
    this.sessionManager = sessionManager;
  }

  async authenticate(credentials?: Partial<AuthenticationCredentials>): Promise<boolean> {
    console.log('\nConnecting to Telegram...');
    
    try {
      await this.client.connect();
      
      if (await this.client.checkAuthorization()) {
        console.log('Successfully connected using saved session!');
        return true;
      }
    } catch (error) {
      console.log('Saved session is invalid, need to re-authenticate...');
      this.sessionManager.clearSavedSession();
      this.sessionManager.createNewSession();
      
      this.client = new TelegramClient(
        this.sessionManager.getSession(),
        this.client.apiId,
        this.client.apiHash,
        { connectionRetries: 5 }
      );
      
      this.sessionManager.setClient(this.client);
    }
    
    await this.client.start({
      phoneNumber: credentials?.phoneNumber 
        ? async () => credentials.phoneNumber! 
        : async () => await input.text('Enter your phone number: '),
      password: credentials?.password 
        ? async () => credentials.password! 
        : async () => await input.text('Enter your password (if required): '),
      phoneCode: credentials?.phoneCode 
        ? async () => credentials.phoneCode! 
        : async () => await input.text('Enter the code you received: '),
      onError: (err: Error) => console.log('Authentication error:', err.message),
    });

    console.log('Successfully authenticated!');
    
    this.sessionManager.saveSession();
    
    return true;
  }

  async checkAuthorization(): Promise<boolean> {
    try {
      return await this.client.checkAuthorization();
    } catch (error) {
      return false;
    }
  }

  async getUserInfo(): Promise<any> {
    try {
      if (await this.checkAuthorization()) {
        return await this.client.getMe();
      }
      throw new Error('Not authenticated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get user info: ${errorMessage}`);
    }
  }

  async reauthenticate(): Promise<boolean> {
    try {
      this.sessionManager.clearSavedSession();
      this.sessionManager.createNewSession();
      
      this.client = new TelegramClient(
        this.sessionManager.getSession(),
        this.client.apiId,
        this.client.apiHash,
        { connectionRetries: 5 }
      );
      
      this.sessionManager.setClient(this.client);
      
      return await this.authenticate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Reauthentication failed:', errorMessage);
      return false;
    }
  }

  getClient(): TelegramClient {
    return this.client;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
}