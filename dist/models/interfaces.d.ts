import { AppConfig, ContactsExport, DialogInfo, Message, GroupMember, ExportFormat, ExtractedTextMessage, SessionInfo, AuthenticationCredentials, MonitoringOptions, ExportOptions } from './types';
export interface ISessionManager {
    loadSavedSession(): boolean;
    saveSession(): boolean;
    clearSavedSession(): void;
    getSessionInfo(): SessionInfo;
    exportSessionString(): string | null;
    importSessionString(sessionString: string): boolean;
}
export interface IAuthenticationService {
    authenticate(credentials?: Partial<AuthenticationCredentials>): Promise<boolean>;
    checkAuthorization(): Promise<boolean>;
    getUserInfo(): Promise<any>;
}
export interface IContactService {
    getAllContacts(): Promise<ContactsExport>;
    exportAllContacts(format?: ExportFormat): Promise<string>;
}
export interface IDialogService {
    getDialogs(): Promise<DialogInfo[]>;
    selectGroup(): Promise<DialogInfo>;
}
export interface IMessageService {
    exportMessages(group: DialogInfo, options?: ExportOptions): Promise<Message[]>;
    getNewMessages(group: DialogInfo, sinceDate?: Date | null, limit?: number): Promise<Message[]>;
    loadExistingMessages(filePath: string): Promise<Message[]>;
    updateExistingFile(filePath: string, newMessages: Message[]): Promise<void>;
    monitorGroupMessages(group: DialogInfo, options: MonitoringOptions): Promise<void>;
}
export interface IMemberService {
    getGroupMembers(group: DialogInfo, limit?: number | null): Promise<GroupMember[]>;
    exportGroupMembers(group: DialogInfo, format?: ExportFormat, limit?: number | null): Promise<string | null>;
}
export interface IFileService {
    saveToFile(data: any, fileName: string, format?: ExportFormat): Promise<string>;
    findMessageFiles(): string[];
    createBackup(filePath: string): void;
}
export interface ITextProcessor {
    extractTextFromJson(inputFile: string, outputFile: string): ExtractedTextMessage[];
    convertToMarkdown(inputFile: string, outputFile: string): void;
}
export interface ITelegramExporter {
    initialize(): Promise<void>;
    run(): Promise<void>;
    showMainMenu(): Promise<number>;
}
export interface IConfigManager {
    loadConfig(): AppConfig;
    validateConfig(config: AppConfig): boolean;
}
export interface IUserInterface {
    showMainMenu(): Promise<number>;
    showSessionMenu(): Promise<number>;
    getInput(prompt: string): Promise<string>;
    displayInfo(message: string): void;
    displayError(error: string): void;
    displaySuccess(message: string): void;
}
//# sourceMappingURL=interfaces.d.ts.map