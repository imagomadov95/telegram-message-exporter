"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
class ContactService {
    constructor(_client, fileService) {
        this.fileService = fileService;
    }
    async getAllContacts() {
        // Заглушка для компиляции
        return {
            contacts: [],
            groups: [],
            channels: [],
            bots: []
        };
    }
    async exportAllContacts(format = 'json') {
        const allContacts = await this.getAllContacts();
        const filePath = await this.fileService.saveToFile(allContacts, 'telegram_contacts', format);
        console.log(`All contacts exported to: ${filePath}`);
        return filePath;
    }
}
exports.ContactService = ContactService;
//# sourceMappingURL=contact-service-simple.js.map