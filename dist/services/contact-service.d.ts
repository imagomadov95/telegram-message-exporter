import { TelegramClient } from 'telegram';
import { ContactsExport, ExportFormat, ContactInfo } from '../models/types';
import { IContactService } from '../models/interfaces';
import { FileService } from '../utils/file-service';
export declare class ContactService implements IContactService {
    private client;
    private fileService;
    constructor(client: TelegramClient, fileService: FileService);
    getAllContacts(): Promise<ContactsExport>;
    exportAllContacts(format?: ExportFormat): Promise<string>;
    getContactById(userId: number): Promise<ContactInfo | null>;
    searchContacts(query: string): Promise<ContactInfo[]>;
    private formatContactsForDisplay;
}
//# sourceMappingURL=contact-service.d.ts.map