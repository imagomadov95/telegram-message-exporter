"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const fs = __importStar(require("fs"));
class MessageService {
    constructor(client, fileService) {
        this.client = client;
        this.fileService = fileService;
    }
    async exportMessages(group, options = { format: 'json' }) {
        console.log(`\nExporting messages from "${group.title}"...`);
        const messages = [];
        let totalMessages = 0;
        const limit = options.limit || 1000;
        for await (const message of this.client.iterMessages(group.entity, { limit })) {
            if (message.message) {
                const mappedMessage = this.mapTelegramMessage(message);
                if (options.sinceDate && new Date(mappedMessage.date) <= options.sinceDate) {
                    break;
                }
                messages.push(mappedMessage);
                totalMessages++;
                if (totalMessages % 100 === 0) {
                    console.log(`Exported ${totalMessages} messages...`);
                }
            }
        }
        messages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        console.log(`\nExported ${totalMessages} messages total.`);
        return messages;
    }
    async getNewMessages(group, sinceDate = null, limit = 1000) {
        console.log(`\nGetting new messages from "${group.title}"${sinceDate ? ` since ${sinceDate.toLocaleString()}` : ''}...`);
        const messages = [];
        let totalMessages = 0;
        for await (const message of this.client.iterMessages(group.entity, { limit })) {
            if (message.message) {
                const messageDate = message.date ? new Date(message.date * 1000) : new Date();
                if (sinceDate && messageDate <= sinceDate) {
                    break;
                }
                const mappedMessage = this.mapTelegramMessage(message);
                messages.push(mappedMessage);
                totalMessages++;
                if (totalMessages % 100 === 0) {
                    console.log(`Found ${totalMessages} new messages...`);
                }
            }
        }
        messages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        console.log(`\nFound ${totalMessages} new messages total.`);
        return messages;
    }
    async loadExistingMessages(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
                return data;
            }
            return [];
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error loading existing messages:', errorMessage);
            return [];
        }
    }
    async updateExistingFile(filePath, newMessages) {
        if (newMessages.length === 0) {
            console.log('No new messages to add.');
            return;
        }
        try {
            const existingMessages = await this.loadExistingMessages(filePath);
            const allMessages = [...existingMessages, ...newMessages];
            const uniqueMessages = allMessages.filter((msg, index, arr) => arr.findIndex(m => m.id === msg.id) === index);
            uniqueMessages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            this.fileService.createBackup(filePath);
            fs.writeFileSync(filePath, JSON.stringify(uniqueMessages, null, 2), 'utf8');
            console.log(`Updated ${filePath} with ${newMessages.length} new messages`);
            console.log(`Total messages in file: ${uniqueMessages.length}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error updating file:', errorMessage);
            throw error;
        }
    }
    async monitorGroupMessages(group, options) {
        console.log(`\nStarting real-time monitoring of "${group.title}"`);
        console.log(`Check interval: ${options.checkInterval / 1000} seconds`);
        console.log('Press Ctrl+C to stop monitoring\n');
        let lastCheck = new Date();
        let isRunning = options.isRunning;
        process.on('SIGINT', () => {
            console.log('\nStopping message monitoring...');
            isRunning = false;
        });
        while (isRunning) {
            try {
                await new Promise(resolve => setTimeout(resolve, options.checkInterval));
                if (!isRunning)
                    break;
                const newMessages = await this.getNewMessages(group, lastCheck, 100);
                if (newMessages.length > 0) {
                    console.log(`\n📨 ${newMessages.length} new message(s) received:`);
                    newMessages.forEach(msg => {
                        const sender = this.formatSenderName(msg.sender);
                        const time = new Date(msg.date).toLocaleTimeString();
                        const text = msg.text.length > 100 ? msg.text.substring(0, 100) + '...' : msg.text;
                        console.log(`[${time}] ${sender}: ${text}`);
                    });
                    console.log(`\nDo you want to save these messages to a file? (y/n)`);
                }
                lastCheck = new Date();
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error('Error during monitoring:', errorMessage);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        console.log('Message monitoring stopped.');
    }
    async getLatestMessageDate(messages) {
        if (messages.length === 0) {
            return null;
        }
        const latestMessage = messages.reduce((latest, current) => {
            const currentDate = new Date(current.date);
            const latestDate = new Date(latest.date);
            return currentDate > latestDate ? current : latest;
        });
        return new Date(latestMessage.date);
    }
    mapTelegramMessage(telegramMessage) {
        const message = {
            id: telegramMessage.id,
            date: telegramMessage.date ? new Date(telegramMessage.date * 1000).toISOString() : new Date().toISOString(),
            text: telegramMessage.message,
            isForwarded: !!telegramMessage.fwdFrom,
            hasMedia: !!telegramMessage.media,
            mediaType: telegramMessage.media ? telegramMessage.media.className : null
        };
        if (telegramMessage.sender) {
            message.sender = {
                id: telegramMessage.sender.id,
                firstName: telegramMessage.sender.firstName,
                lastName: telegramMessage.sender.lastName,
                username: telegramMessage.sender.username
            };
        }
        return message;
    }
    formatSenderName(sender) {
        if (!sender)
            return 'Unknown';
        const name = `${sender.firstName || ''} ${sender.lastName || ''}`.trim();
        if (name)
            return name;
        if (sender.username)
            return `@${sender.username}`;
        return `User ${sender.id}`;
    }
}
exports.MessageService = MessageService;
//# sourceMappingURL=message-service.js.map