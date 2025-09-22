/**
 * Упрощенная версия для демонстрации архитектуры без Telegram API
 */
import { ContactsExport, DialogInfo, Message, GroupMember, ExportFormat } from './models/types';
import { ISessionManager, IAuthenticationService, IContactService, IDialogService, IMessageService, IMemberService, ITelegramExporter } from './models/interfaces';
import { FileService } from './utils/file-service';
export declare class SimpleSessionManager implements ISessionManager {
    loadSavedSession(): boolean;
    saveSession(): boolean;
    clearSavedSession(): void;
    getSessionInfo(): any;
    exportSessionString(): string | null;
    importSessionString(_sessionString: string): boolean;
}
export declare class SimpleAuthService implements IAuthenticationService {
    authenticate(): Promise<boolean>;
    checkAuthorization(): Promise<boolean>;
    getUserInfo(): Promise<any>;
}
export declare class SimpleContactService implements IContactService {
    private fileService;
    constructor(fileService: FileService);
    getAllContacts(): Promise<ContactsExport>;
    exportAllContacts(format?: ExportFormat): Promise<string>;
}
export declare class SimpleDialogService implements IDialogService {
    getDialogs(): Promise<DialogInfo[]>;
    selectGroup(): Promise<DialogInfo>;
}
export declare class SimpleMessageService implements IMessageService {
    constructor(_fileService: FileService);
    exportMessages(_group: DialogInfo, _options?: any): Promise<Message[]>;
    getNewMessages(_group: DialogInfo, _sinceDate?: Date | null, _limit?: number): Promise<Message[]>;
    loadExistingMessages(_filePath: string): Promise<Message[]>;
    updateExistingFile(_filePath: string, _newMessages: Message[]): Promise<void>;
    monitorGroupMessages(_group: DialogInfo, _options: any): Promise<void>;
}
export declare class SimpleMemberService implements IMemberService {
    private fileService;
    constructor(fileService: FileService);
    getGroupMembers(_group: DialogInfo, _limit?: number | null): Promise<GroupMember[]>;
    exportGroupMembers(group: DialogInfo, format?: ExportFormat, limit?: number | null): Promise<string | null>;
}
export declare class SimpleTelegramExporter implements ITelegramExporter {
    private ui;
    constructor();
    initialize(): Promise<void>;
    showMainMenu(): Promise<number>;
    run(): Promise<void>;
}
//# sourceMappingURL=simple-version.d.ts.map