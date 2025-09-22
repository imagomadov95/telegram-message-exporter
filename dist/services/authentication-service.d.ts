import { TelegramClient } from 'telegram';
import { AuthenticationCredentials } from '../models/types';
import { IAuthenticationService } from '../models/interfaces';
import { SessionManager } from './session-manager';
export declare class AuthenticationService implements IAuthenticationService {
    private client;
    private sessionManager;
    constructor(client: TelegramClient, sessionManager: SessionManager);
    authenticate(credentials?: Partial<AuthenticationCredentials>): Promise<boolean>;
    checkAuthorization(): Promise<boolean>;
    getUserInfo(): Promise<any>;
    reauthenticate(): Promise<boolean>;
    getClient(): TelegramClient;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=authentication-service.d.ts.map