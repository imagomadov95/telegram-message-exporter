
const { Api, TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const fs = require('fs');
const path = require('path');

class TelegramMessageExporter {
    constructor() {
        this.apiId = null;
        this.apiHash = null;
        this.session = new StringSession('');
        this.client = null;
    }

    async initialize() {
        console.log('=== Telegram Message Exporter ===\n');
        
        // Load configuration
        try {
            const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
            this.apiId = config.telegram.apiId;
            this.apiHash = config.telegram.apiHash;
        } catch (error) {
            console.error('Error loading config.json. Please copy config.example.json to config.json and fill in your API credentials.');
            console.error('You can get API credentials from https://my.telegram.org/apps');
            process.exit(1);
        }
        
        const sessionString = await input.text('Enter session string (leave empty for new session): ');
        if (sessionString) {
            this.session = new StringSession(sessionString);
        }

        this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
            connectionRetries: 5,
        });
    }

    async authenticate() {
        console.log('\nConnecting to Telegram...');
        await this.client.start({
            phoneNumber: async () => await input.text('Enter your phone number: '),
            password: async () => await input.text('Enter your password: '),
            phoneCode: async () => await input.text('Enter the code you received: '),
            onError: (err) => console.log('Error:', err),
        });

        console.log('Successfully connected!');
        console.log('Save this session string for future use:');
        console.log(this.client.session.save());
    }

    async getDialogs() {
        const dialogs = await this.client.getDialogs();
        return dialogs.filter(dialog => 
            dialog.isGroup || dialog.isChannel
        );
    }

    async selectGroup() {
        const groups = await this.getDialogs();
        
        console.log('\nAvailable groups and channels:');
        groups.forEach((group, index) => {
            console.log(`${index + 1}. ${group.title} (${group.isChannel ? 'Channel' : 'Group'})`);
        });

        const choice = await input.text('\nSelect group number: ');
        const selectedGroup = groups[parseInt(choice) - 1];
        
        if (!selectedGroup) {
            throw new Error('Invalid selection');
        }

        return selectedGroup;
    }

    async exportMessages(group, limit = 1000) {
        console.log(`\nExporting messages from "${group.title}"...`);
        
        const messages = [];
        let totalMessages = 0;

        for await (const message of this.client.iterMessages(group.entity, { limit })) {
            if (message.message) {
                messages.push({
                    id: message.id,
                    date: message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString(),
                    sender: message.sender ? {
                        id: message.sender.id,
                        firstName: message.sender.firstName,
                        lastName: message.sender.lastName,
                        username: message.sender.username
                    } : null,
                    text: message.message,
                    isForwarded: !!message.fwdFrom,
                    hasMedia: !!message.media,
                    mediaType: message.media ? message.media.className : null
                });
                totalMessages++;
                
                if (totalMessages % 100 === 0) {
                    console.log(`Exported ${totalMessages} messages...`);
                }
            }
        }

        console.log(`\nExported ${totalMessages} messages total.`);
        return messages;
    }

    async saveToFile(messages, groupName, format = 'json') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${groupName}_messages_${timestamp}`;
        
        let filePath;
        let content;

        switch (format.toLowerCase()) {
            case 'json':
                filePath = `${fileName}.json`;
                content = JSON.stringify(messages, null, 2);
                break;
            
            case 'csv':
                filePath = `${fileName}.csv`;
                const csvHeader = 'ID,Date,Sender,Username,Text,IsForwarded,HasMedia,MediaType\n';
                const csvRows = messages.map(msg => {
                    const sender = msg.sender ? msg.sender.firstName + ' ' + (msg.sender.lastName || '') : '';
                    const username = msg.sender ? msg.sender.username || '' : '';
                    const text = msg.text.replace(/"/g, '""').replace(/\n/g, ' ');
                    return `${msg.id},"${msg.date}","${sender}","${username}","${text}",${msg.isForwarded},${msg.hasMedia},"${msg.mediaType || ''}"`;
                }).join('\n');
                content = csvHeader + csvRows;
                break;
            
            default:
                throw new Error('Unsupported format. Use "json" or "csv"');
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Messages saved to: ${filePath}`);
        return filePath;
    }

    async run() {
        try {
            await this.initialize();
            await this.authenticate();
            
            const selectedGroup = await this.selectGroup();
            
            const messageLimit = await input.text('Enter message limit (default 1000): ') || '1000';
            const exportFormat = await input.text('Enter export format (json/csv, default json): ') || 'json';
            
            const messages = await this.exportMessages(selectedGroup, parseInt(messageLimit));
            
            if (messages.length > 0) {
                await this.saveToFile(messages, selectedGroup.title, exportFormat);
                console.log('\nExport completed successfully!');
            } else {
                console.log('No messages found to export.');
            }
            
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            if (this.client) {
                await this.client.disconnect();
            }
        }
    }
}

if (require.main === module) {
    const exporter = new TelegramMessageExporter();
    exporter.run();
}
