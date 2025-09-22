import { ContactsExport, ExportFormat } from '../models/types';
import { IContactService } from '../models/interfaces';
import { FileService } from '../utils/file-service';

export class ContactService implements IContactService {
  private fileService: FileService;

  constructor(_client: any, fileService: FileService) {
    this.fileService = fileService;
  }

  async getAllContacts(): Promise<ContactsExport> {
    // Заглушка для компиляции
    return {
      contacts: [],
      groups: [],
      channels: [],
      bots: []
    };
  }

  async exportAllContacts(format: ExportFormat = 'json'): Promise<string> {
    const allContacts = await this.getAllContacts();
    const filePath = await this.fileService.saveToFile(allContacts, 'telegram_contacts', format);
    console.log(`All contacts exported to: ${filePath}`);
    return filePath;
  }
}