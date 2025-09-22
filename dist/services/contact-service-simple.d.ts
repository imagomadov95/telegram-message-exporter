import { ContactsExport, ExportFormat } from '../models/types';
import { IContactService } from '../models/interfaces';
import { FileService } from '../utils/file-service';
export declare class ContactService implements IContactService {
    private fileService;
    constructor(_client: any, fileService: FileService);
    getAllContacts(): Promise<ContactsExport>;
    exportAllContacts(format?: ExportFormat): Promise<string>;
}
//# sourceMappingURL=contact-service-simple.d.ts.map