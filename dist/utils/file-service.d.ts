import { ExportFormat } from '../models/types';
import { IFileService } from '../models/interfaces';
export declare class FileService implements IFileService {
    saveToFile(data: any, fileName: string, format?: ExportFormat): Promise<string>;
    findMessageFiles(): string[];
    createBackup(filePath: string): void;
    private sanitizeFileName;
    private convertToCSV;
    private isMessageArray;
    private isMemberArray;
    private isContactsExport;
    private convertMessagesToCSV;
    private convertMembersToCSV;
    private convertContactsToCSV;
    private escapeCSV;
}
//# sourceMappingURL=file-service.d.ts.map