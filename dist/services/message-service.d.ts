import { TelegramClient } from 'telegram';
import { DialogInfo, Message, ExportOptions } from '../models/types';
import { IMessageService } from '../models/interfaces';
import { FileService } from '../utils/file-service';
export declare class MessageService implements IMessageService {
    private client;
    private fileService;
    constructor(client: TelegramClient, fileService: FileService);
    exportMessages(group: DialogInfo, options?: ExportOptions): Promise<Message[]>;
    getNewMessages(group: DialogInfo, sinceDate?: Date | null, limit?: number): Promise<Message[]>;
    loadExistingMessages(filePath: string): Promise<Message[]>;
    updateExistingFile(filePath: string, newMessages: Message[]): Promise<void>;
    monitorGroupMessages(group: DialogInfo, options: {
        checkInterval: number;
        isRunning: boolean;
    }): Promise<void>;
    getLatestMessageDate(messages: Message[]): Promise<Date | null>;
    private mapTelegramMessage;
    private formatSenderName;
}
//# sourceMappingURL=message-service.d.ts.map