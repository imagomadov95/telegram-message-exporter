import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { SessionInfo } from '../models/types';
import { ISessionManager } from '../models/interfaces';
export declare class SessionManager implements ISessionManager {
    private readonly sessionFile;
    private session;
    private client;
    constructor(client?: TelegramClient);
    setClient(client: TelegramClient): void;
    getSession(): StringSession;
    loadSavedSession(): boolean;
    saveSession(): boolean;
    clearSavedSession(): void;
    getSessionInfo(): SessionInfo;
    exportSessionString(): string | null;
    importSessionString(sessionString: string): boolean;
    createNewSession(): StringSession;
    displaySessionInfo(): Promise<void>;
}
//# sourceMappingURL=session-manager.d.ts.map