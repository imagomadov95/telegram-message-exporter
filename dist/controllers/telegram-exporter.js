"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramMessageExporter = void 0;
const telegram_1 = require("telegram");
const config_manager_1 = require("../utils/config-manager");
const file_service_1 = require("../utils/file-service");
const user_interface_1 = require("../utils/user-interface");
const session_manager_1 = require("../services/session-manager");
const authentication_service_1 = require("../services/authentication-service");
const contact_service_1 = require("../services/contact-service");
const dialog_service_1 = require("../services/dialog-service");
const message_service_1 = require("../services/message-service");
const member_service_1 = require("../services/member-service");
class TelegramMessageExporter {
    constructor() {
        this.configManager = new config_manager_1.ConfigManager();
        this.fileService = new file_service_1.FileService();
        this.ui = new user_interface_1.UserInterface();
        this.config = { telegram: { apiId: 0, apiHash: '' } };
        this.client = {};
        this.sessionManager = new session_manager_1.SessionManager();
        this.authService = {};
        this.contactService = {};
        this.dialogService = {};
        this.messageService = {};
        this.memberService = {};
    }
    async initialize() {
        this.ui.displayInfo('=== Telegram Message Exporter ===\n');
        try {
            this.config = this.configManager.loadConfig();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError('Error loading config.json. Please copy config.example.json to config.json and fill in your API credentials.');
            this.ui.displayInfo('You can get API credentials from https://my.telegram.org/apps');
            throw new Error(errorMessage);
        }
        const hasSession = this.sessionManager.loadSavedSession();
        if (!hasSession) {
            this.ui.displayInfo('No saved session found.');
            const useManualSession = await this.ui.confirmAction('Do you want to enter session string manually?');
            if (useManualSession) {
                const sessionString = await this.ui.getInput('Enter session string: ');
                if (sessionString) {
                    this.sessionManager.importSessionString(sessionString);
                }
            }
        }
        this.client = new telegram_1.TelegramClient(this.sessionManager.getSession(), this.config.telegram.apiId, this.config.telegram.apiHash, { connectionRetries: 5 });
        this.sessionManager.setClient(this.client);
        this.authService = new authentication_service_1.AuthenticationService(this.client, this.sessionManager);
        this.contactService = new contact_service_1.ContactService(this.client, this.fileService);
        this.dialogService = new dialog_service_1.DialogService(this.client);
        this.messageService = new message_service_1.MessageService(this.client, this.fileService);
        this.memberService = new member_service_1.MemberService(this.client, this.fileService);
    }
    async showMainMenu() {
        return await this.ui.showMainMenu();
    }
    async run() {
        try {
            await this.initialize();
            await this.authService.authenticate();
            while (true) {
                const choice = await this.showMainMenu();
                switch (choice) {
                    case 1:
                        await this.runMessageExport();
                        break;
                    case 2:
                        await this.runContactsExport();
                        break;
                    case 3:
                        await this.runMembersExport();
                        break;
                    case 4:
                        await this.runMessageMonitoring();
                        break;
                    case 5:
                        await this.runUpdateExistingFile();
                        break;
                    case 6:
                        await this.runSessionManagement();
                        break;
                    case 7:
                        this.ui.displayInfo('\nGoodbye!');
                        return;
                    default:
                        this.ui.displayError('Invalid choice. Please select 1-7.');
                        continue;
                }
                const continueChoice = await this.ui.confirmAction('Do you want to perform another operation?');
                if (!continueChoice) {
                    this.ui.displayInfo('\nGoodbye!');
                    break;
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(errorMessage);
        }
        finally {
            await this.authService.disconnect();
        }
    }
    async runMessageExport() {
        try {
            const selectedGroup = await this.dialogService.selectGroup();
            const messageLimitStr = await this.ui.getInput('Enter message limit (default 1000): ');
            const messageLimit = messageLimitStr ? parseInt(messageLimitStr, 10) : 1000;
            const exportFormat = await this.ui.getInput('Enter export format (json/csv, default json): ') || 'json';
            const messages = await this.messageService.exportMessages(selectedGroup, {
                limit: messageLimit,
                format: exportFormat
            });
            if (messages.length > 0) {
                const fileName = `${selectedGroup.title}_messages`;
                await this.fileService.saveToFile(messages, fileName, exportFormat);
                this.ui.displaySuccess('Message export completed successfully!');
            }
            else {
                this.ui.displayInfo('No messages found to export.');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(`Error during message export: ${errorMessage}`);
        }
    }
    async runContactsExport() {
        try {
            const exportFormat = await this.ui.getInput('Enter export format (json/csv, default json): ') || 'json';
            await this.contactService.exportAllContacts(exportFormat);
            this.ui.displaySuccess('Contacts export completed successfully!');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(`Error during contacts export: ${errorMessage}`);
        }
    }
    async runMembersExport() {
        try {
            const selectedGroup = await this.dialogService.selectGroup();
            const memberLimitStr = await this.ui.getInput('Enter member limit (leave empty for all members): ');
            const memberLimit = memberLimitStr ? parseInt(memberLimitStr, 10) : null;
            const exportFormat = await this.ui.getInput('Enter export format (json/csv, default json): ') || 'json';
            const filePath = await this.memberService.exportGroupMembers(selectedGroup, exportFormat, memberLimit);
            if (filePath) {
                this.ui.displaySuccess('Members export completed successfully!');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(`Error during members export: ${errorMessage}`);
        }
    }
    async runMessageMonitoring() {
        try {
            const selectedGroup = await this.dialogService.selectGroup();
            const intervalStr = await this.ui.getInput('Enter check interval in seconds (default 30): ') || '30';
            const interval = parseInt(intervalStr, 10) * 1000;
            await this.messageService.monitorGroupMessages(selectedGroup, {
                checkInterval: interval,
                isRunning: true
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(`Error during message monitoring: ${errorMessage}`);
        }
    }
    async runUpdateExistingFile() {
        try {
            this.ui.displayHeader('Update Existing Message File');
            const files = this.fileService.findMessageFiles();
            if (files.length === 0) {
                this.ui.displayInfo('No message export files found in current directory.');
                this.ui.displayInfo('Please export messages first using option 1.');
                return;
            }
            this.ui.displayFileList(files, 'Found message export files');
            const fileIndex = await this.ui.selectFromList(files, 'Select file number to update: ');
            const selectedFile = files[fileIndex];
            if (!selectedFile) {
                this.ui.displayError('Invalid file selection.');
                return;
            }
            const existingMessages = await this.messageService.loadExistingMessages(selectedFile);
            const latestDate = await this.messageService.getLatestMessageDate(existingMessages);
            this.ui.displayInfo(`\nFile: ${selectedFile}`);
            this.ui.displayInfo(`Current messages: ${existingMessages.length}`);
            if (latestDate) {
                this.ui.displayInfo(`Latest message date: ${latestDate.toLocaleString()}`);
            }
            const selectedGroup = await this.dialogService.selectGroup();
            const newMessages = await this.messageService.getNewMessages(selectedGroup, latestDate);
            if (newMessages.length === 0) {
                this.ui.displayInfo('No new messages found since last export.');
                return;
            }
            this.ui.displayInfo(`\nFound ${newMessages.length} new messages.`);
            const confirm = await this.ui.confirmAction('Update the file with new messages?');
            if (confirm) {
                await this.messageService.updateExistingFile(selectedFile, newMessages);
                this.ui.displaySuccess('File update completed successfully!');
            }
            else {
                this.ui.displayInfo('Update cancelled.');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(`Error during file update: ${errorMessage}`);
        }
    }
    async runSessionManagement() {
        try {
            while (true) {
                const choice = await this.ui.showSessionMenu();
                switch (choice) {
                    case 1:
                        await this.sessionManager.displaySessionInfo();
                        break;
                    case 2:
                        await this.clearSavedSessionInteractive();
                        break;
                    case 3:
                        await this.exportSessionString();
                        break;
                    case 4:
                        await this.importSessionString();
                        break;
                    case 5:
                        return;
                    default:
                        this.ui.displayError('Invalid choice.');
                }
                await this.ui.getInput('\nPress Enter to continue...');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(`Error in session management: ${errorMessage}`);
        }
    }
    async clearSavedSessionInteractive() {
        this.ui.displayHeader('Clear Saved Session');
        this.ui.displayInfo('This will force you to re-authenticate on next startup.');
        const confirm = await this.ui.confirmAction('Are you sure?');
        if (confirm) {
            this.sessionManager.clearSavedSession();
            this.ui.displaySuccess('Session cleared. You will need to re-authenticate on next startup.');
        }
        else {
            this.ui.displayInfo('Operation cancelled.');
        }
    }
    async exportSessionString() {
        try {
            const sessionString = this.sessionManager.exportSessionString();
            if (sessionString) {
                this.ui.displayHeader('Current Session String');
                this.ui.displayInfo('Copy this string to backup your session:');
                this.ui.displayInfo(sessionString);
                this.ui.displayInfo('\nKeep this string safe - anyone with it can access your Telegram account!');
            }
            else {
                this.ui.displayError('No active session to export.');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(`Error exporting session: ${errorMessage}`);
        }
    }
    async importSessionString() {
        try {
            this.ui.displayHeader('Import Session String');
            this.ui.displayInfo('Warning: This will replace your current session.');
            const sessionString = await this.ui.getInput('Enter session string: ');
            if (this.sessionManager.importSessionString(sessionString)) {
                this.ui.displaySuccess('Session string imported and saved.');
                this.ui.displayInfo('Please restart the application to use the new session.');
            }
            else {
                this.ui.displayError('Invalid session string.');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.ui.displayError(`Error importing session: ${errorMessage}`);
        }
    }
}
exports.TelegramMessageExporter = TelegramMessageExporter;
//# sourceMappingURL=telegram-exporter.js.map