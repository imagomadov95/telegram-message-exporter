import { ITelegramExporter } from '../models/interfaces';
export declare class TelegramMessageExporter implements ITelegramExporter {
    private config;
    private client;
    private configManager;
    private fileService;
    private ui;
    private sessionManager;
    private authService;
    private contactService;
    private dialogService;
    private messageService;
    private memberService;
    constructor();
    initialize(): Promise<void>;
    showMainMenu(): Promise<number>;
    run(): Promise<void>;
    private runMessageExport;
    private runContactsExport;
    private runMembersExport;
    private runMessageMonitoring;
    private runUpdateExistingFile;
    private runSessionManagement;
    private clearSavedSessionInteractive;
    private exportSessionString;
    private importSessionString;
}
//# sourceMappingURL=telegram-exporter.d.ts.map