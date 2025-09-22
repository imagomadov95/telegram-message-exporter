
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
        this.sessionFile = 'telegram_session.txt';
    }

    loadSavedSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const sessionString = fs.readFileSync(this.sessionFile, 'utf8').trim();
                if (sessionString) {
                    console.log('Found saved session, attempting to use it...');
                    this.session = new StringSession(sessionString);
                    return true;
                }
            }
        } catch (error) {
            console.log('Error loading saved session:', error.message);
        }
        return false;
    }

    saveSession() {
        try {
            if (this.client && this.client.session) {
                const sessionString = this.client.session.save();
                fs.writeFileSync(this.sessionFile, sessionString, 'utf8');
                console.log(`Session saved to ${this.sessionFile}`);
                return true;
            }
        } catch (error) {
            console.error('Error saving session:', error.message);
        }
        return false;
    }

    clearSavedSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                fs.unlinkSync(this.sessionFile);
                console.log('Saved session cleared.');
            }
        } catch (error) {
            console.error('Error clearing session:', error.message);
        }
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
        
        // Try to load saved session
        const hasSession = this.loadSavedSession();
        
        if (!hasSession) {
            console.log('No saved session found.');
            const useManualSession = await input.text('Do you want to enter session string manually? (y/n): ');
            
            if (useManualSession.toLowerCase() === 'y' || useManualSession.toLowerCase() === 'yes') {
                const sessionString = await input.text('Enter session string: ');
                if (sessionString) {
                    this.session = new StringSession(sessionString);
                }
            }
        }

        this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
            connectionRetries: 5,
        });
    }

    async authenticate() {
        console.log('\nConnecting to Telegram...');
        
        try {
            const isConnected = await this.client.connect();
            
            if (await this.client.checkAuthorization()) {
                console.log('Successfully connected using saved session!');
                return true;
            }
        } catch (error) {
            console.log('Saved session is invalid, need to re-authenticate...');
            this.clearSavedSession();
            this.session = new StringSession('');
            this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
                connectionRetries: 5,
            });
        }
        
        // Need to authenticate with phone number
        await this.client.start({
            phoneNumber: async () => await input.text('Enter your phone number: '),
            password: async () => await input.text('Enter your password (if required): '),
            phoneCode: async () => await input.text('Enter the code you received: '),
            onError: (err) => console.log('Authentication error:', err),
        });

        console.log('Successfully authenticated!');
        
        // Save session automatically
        this.saveSession();
        
        return true;
    }

    async getDialogs() {
        const dialogs = await this.client.getDialogs();
        return dialogs.filter(dialog => 
            dialog.isGroup || dialog.isChannel
        );
    }

    async getAllContacts() {
        console.log('\nGetting all contacts, groups, and channels...');
        
        // Получаем все диалоги
        const allDialogs = await this.client.getDialogs();
        
        // Получаем контакты пользователей
        const contacts = await this.client.invoke(new Api.contacts.GetContacts({
            hash: 0
        }));

        const result = {
            contacts: [],
            groups: [],
            channels: [],
            bots: []
        };

        // Обрабатываем контакты
        if (contacts.users) {
            contacts.users.forEach(user => {
                const contactInfo = {
                    id: user.id,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    username: user.username || '',
                    phone: user.phone || '',
                    isBot: user.bot || false,
                    isPremium: user.premium || false,
                    isVerified: user.verified || false,
                    lastSeenStatus: user.status ? user.status.className : null
                };

                if (user.bot) {
                    result.bots.push(contactInfo);
                } else {
                    result.contacts.push(contactInfo);
                }
            });
        }

        // Обрабатываем диалоги (группы и каналы)
        allDialogs.forEach(dialog => {
            if (dialog.isGroup) {
                result.groups.push({
                    id: dialog.entity.id,
                    title: dialog.title,
                    username: dialog.entity.username || '',
                    participantsCount: dialog.entity.participantsCount || 0,
                    type: 'group',
                    isCreator: dialog.entity.creator || false,
                    hasGeo: dialog.entity.hasGeo || false,
                    restrictionReason: dialog.entity.restrictionReason || null
                });
            } else if (dialog.isChannel) {
                result.channels.push({
                    id: dialog.entity.id,
                    title: dialog.title,
                    username: dialog.entity.username || '',
                    participantsCount: dialog.entity.participantsCount || 0,
                    type: 'channel',
                    isBroadcast: dialog.entity.broadcast || false,
                    isMegagroup: dialog.entity.megagroup || false,
                    isVerified: dialog.entity.verified || false,
                    restrictionReason: dialog.entity.restrictionReason || null
                });
            }
        });

        console.log(`Found ${result.contacts.length} contacts, ${result.groups.length} groups, ${result.channels.length} channels, ${result.bots.length} bots`);
        return result;
    }

    async exportAllContacts(format = 'json') {
        const allContacts = await this.getAllContacts();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `telegram_contacts_${timestamp}`;
        
        let filePath;
        let content;

        switch (format.toLowerCase()) {
            case 'json':
                filePath = `${fileName}.json`;
                content = JSON.stringify(allContacts, null, 2);
                break;
            
            case 'csv':
                filePath = `${fileName}.csv`;
                const csvHeader = 'Type,ID,Name,Username,Phone,Title,ParticipantsCount,IsBot,IsPremium,IsVerified,IsBroadcast,IsMegagroup\n';
                
                let csvRows = [];
                
                // Добавляем контакты
                allContacts.contacts.forEach(contact => {
                    const name = `${contact.firstName} ${contact.lastName}`.trim();
                    csvRows.push(`Contact,${contact.id},"${name}","${contact.username}","${contact.phone}","","",${contact.isBot},${contact.isPremium},${contact.isVerified},"",""`);
                });

                // Добавляем ботов
                allContacts.bots.forEach(bot => {
                    const name = `${bot.firstName} ${bot.lastName}`.trim();
                    csvRows.push(`Bot,${bot.id},"${name}","${bot.username}","${bot.phone}","","",${bot.isBot},${bot.isPremium},${bot.isVerified},"",""`);
                });

                // Добавляем группы
                allContacts.groups.forEach(group => {
                    csvRows.push(`Group,${group.id},"","${group.username}","","${group.title}",${group.participantsCount},"","","","",""`);
                });

                // Добавляем каналы
                allContacts.channels.forEach(channel => {
                    csvRows.push(`Channel,${channel.id},"","${channel.username}","","${channel.title}",${channel.participantsCount},"","",${channel.isVerified},${channel.isBroadcast},${channel.isMegagroup}`);
                });

                content = csvHeader + csvRows.join('\n');
                break;
            
            default:
                throw new Error('Unsupported format. Use "json" or "csv"');
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`All contacts exported to: ${filePath}`);
        return filePath;
    }

    async getGroupMembers(group, limit = null) {
        console.log(`\nGetting members from "${group.title}"...`);
        
        const members = [];
        let totalMembers = 0;

        try {
            for await (const participant of this.client.iterParticipants(group.entity, { limit })) {
                const memberInfo = {
                    id: participant.id,
                    firstName: participant.firstName || '',
                    lastName: participant.lastName || '',
                    username: participant.username || '',
                    phone: participant.phone || '',
                    isBot: participant.bot || false,
                    isPremium: participant.premium || false,
                    isVerified: participant.verified || false,
                    isDeleted: participant.deleted || false,
                    isSelf: participant.is_self || false,
                    isContact: participant.contact || false,
                    isMutualContact: participant.mutualContact || false,
                    lastSeenStatus: participant.status ? participant.status.className : null,
                    joinDate: null,
                    role: 'member'
                };

                // Получаем дополнительную информацию об участнике если это админ/создатель
                if (participant.participantType) {
                    switch (participant.participantType.className) {
                        case 'ChannelParticipantCreator':
                            memberInfo.role = 'creator';
                            break;
                        case 'ChannelParticipantAdmin':
                            memberInfo.role = 'admin';
                            if (participant.participantType.promotedBy) {
                                memberInfo.promotedBy = participant.participantType.promotedBy;
                            }
                            if (participant.participantType.date) {
                                memberInfo.joinDate = new Date(participant.participantType.date * 1000).toISOString();
                            }
                            break;
                        case 'ChannelParticipant':
                            memberInfo.role = 'member';
                            if (participant.participantType.date) {
                                memberInfo.joinDate = new Date(participant.participantType.date * 1000).toISOString();
                            }
                            break;
                        case 'ChannelParticipantBanned':
                            memberInfo.role = 'banned';
                            memberInfo.bannedBy = participant.participantType.kickedBy;
                            if (participant.participantType.date) {
                                memberInfo.banDate = new Date(participant.participantType.date * 1000).toISOString();
                            }
                            break;
                    }
                }

                members.push(memberInfo);
                totalMembers++;
                
                if (totalMembers % 100 === 0) {
                    console.log(`Got ${totalMembers} members...`);
                }
            }
        } catch (error) {
            console.error('Error getting group members:', error.message);
            if (error.message.includes('CHAT_ADMIN_REQUIRED')) {
                console.error('You need admin rights to get the full member list.');
            }
        }

        console.log(`\nFound ${totalMembers} members total.`);
        return members;
    }

    async exportGroupMembers(group, format = 'json', limit = null) {
        const members = await this.getGroupMembers(group, limit);
        
        if (members.length === 0) {
            console.log('No members found to export.');
            return null;
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${group.title.replace(/[^\w\s]/gi, '_')}_members_${timestamp}`;
        
        let filePath;
        let content;

        switch (format.toLowerCase()) {
            case 'json':
                filePath = `${fileName}.json`;
                content = JSON.stringify({
                    groupInfo: {
                        id: group.entity.id,
                        title: group.title,
                        username: group.entity.username || '',
                        totalMembers: members.length,
                        exportDate: new Date().toISOString()
                    },
                    members: members
                }, null, 2);
                break;
            
            case 'csv':
                filePath = `${fileName}.csv`;
                const csvHeader = 'ID,FirstName,LastName,Username,Phone,Role,IsBot,IsPremium,IsVerified,IsDeleted,IsContact,JoinDate,LastSeenStatus\n';
                const csvRows = members.map(member => {
                    const firstName = member.firstName.replace(/"/g, '""');
                    const lastName = member.lastName.replace(/"/g, '""');
                    const username = member.username.replace(/"/g, '""');
                    return `${member.id},"${firstName}","${lastName}","${username}","${member.phone}","${member.role}",${member.isBot},${member.isPremium},${member.isVerified},${member.isDeleted},${member.isContact},"${member.joinDate || ''}","${member.lastSeenStatus || ''}"`;
                }).join('\n');
                content = csvHeader + csvRows;
                break;
            
            default:
                throw new Error('Unsupported format. Use "json" or "csv"');
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Group members exported to: ${filePath}`);
        return filePath;
    }

    async loadExistingMessages(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return [];
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            
            // Если это файл с сообщениями из группы
            if (Array.isArray(data)) {
                return data;
            }
            
            return [];
        } catch (error) {
            console.error('Error loading existing messages:', error.message);
            return [];
        }
    }

    async getLatestMessageDate(messages) {
        if (messages.length === 0) {
            return null;
        }
        
        // Находим самую позднюю дату
        const latestMessage = messages.reduce((latest, current) => {
            const currentDate = new Date(current.date);
            const latestDate = new Date(latest.date);
            return currentDate > latestDate ? current : latest;
        });
        
        return new Date(latestMessage.date);
    }

    async getNewMessages(group, sinceDate = null, limit = 1000) {
        console.log(`\nGetting new messages from "${group.title}"${sinceDate ? ` since ${sinceDate.toLocaleString()}` : ''}...`);
        
        const messages = [];
        let totalMessages = 0;

        for await (const message of this.client.iterMessages(group.entity, { limit })) {
            if (message.message) {
                const messageDate = message.date ? new Date(message.date * 1000) : new Date();
                
                // Если указана дата, пропускаем старые сообщения
                if (sinceDate && messageDate <= sinceDate) {
                    break;
                }
                
                messages.push({
                    id: message.id,
                    date: messageDate.toISOString(),
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
                    console.log(`Found ${totalMessages} new messages...`);
                }
            }
        }

        // Сортируем по дате (старые сначала)
        messages.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        console.log(`\nFound ${totalMessages} new messages total.`);
        return messages;
    }

    async updateExistingFile(filePath, newMessages) {
        if (newMessages.length === 0) {
            console.log('No new messages to add.');
            return;
        }

        try {
            const existingMessages = await this.loadExistingMessages(filePath);
            const allMessages = [...existingMessages, ...newMessages];
            
            // Удаляем дубликаты по ID
            const uniqueMessages = allMessages.filter((msg, index, arr) => 
                arr.findIndex(m => m.id === msg.id) === index
            );
            
            // Сортируем по дате
            uniqueMessages.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Создаем резервную копию
            const backupPath = filePath.replace(/\.json$/, '_backup.json');
            if (fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, backupPath);
                console.log(`Backup created: ${backupPath}`);
            }
            
            // Сохраняем обновленный файл
            fs.writeFileSync(filePath, JSON.stringify(uniqueMessages, null, 2), 'utf8');
            console.log(`Updated ${filePath} with ${newMessages.length} new messages`);
            console.log(`Total messages in file: ${uniqueMessages.length}`);
            
        } catch (error) {
            console.error('Error updating file:', error.message);
        }
    }

    async monitorGroupMessages(group, checkInterval = 30000) {
        console.log(`\nStarting real-time monitoring of "${group.title}"`);
        console.log(`Check interval: ${checkInterval / 1000} seconds`);
        console.log('Press Ctrl+C to stop monitoring\n');
        
        let lastCheck = new Date();
        let isRunning = true;
        
        // Обработчик для корректного завершения
        process.on('SIGINT', () => {
            console.log('\nStopping message monitoring...');
            isRunning = false;
        });
        
        while (isRunning) {
            try {
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                
                if (!isRunning) break;
                
                const newMessages = await this.getNewMessages(group, lastCheck, 100);
                
                if (newMessages.length > 0) {
                    console.log(`\n📨 ${newMessages.length} new message(s) received:`);
                    
                    newMessages.forEach(msg => {
                        const sender = msg.sender ? 
                            `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim() || 
                            msg.sender.username || 
                            `User ${msg.sender.id}` : 
                            'Unknown';
                        
                        const time = new Date(msg.date).toLocaleTimeString();
                        const text = msg.text.length > 100 ? msg.text.substring(0, 100) + '...' : msg.text;
                        
                        console.log(`[${time}] ${sender}: ${text}`);
                    });
                    
                    // Предлагаем сохранить в файл
                    console.log(`\nDo you want to save these messages to a file? (y/n)`);
                }
                
                lastCheck = new Date();
                
            } catch (error) {
                console.error('Error during monitoring:', error.message);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Ждем 5 секунд при ошибке
            }
        }
        
        console.log('Message monitoring stopped.');
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

    async showMainMenu() {
        console.log('\n=== Main Menu ===');
        console.log('1. Export messages from a group/channel');
        console.log('2. Export all contacts, groups, and channels');
        console.log('3. Export members from a group/channel');
        console.log('4. Monitor group messages in real-time');
        console.log('5. Update existing message file with new messages');
        console.log('6. Session management');
        console.log('7. Exit');
        
        const choice = await input.text('\nSelect option (1-7): ');
        return parseInt(choice);
    }

    async run() {
        try {
            await this.initialize();
            await this.authenticate();
            
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
                        console.log('\nGoodbye!');
                        return;
                    default:
                        console.log('\nInvalid choice. Please select 1-7.');
                        continue;
                }

                const continueChoice = await input.text('\nDo you want to perform another operation? (y/n): ');
                if (continueChoice.toLowerCase() !== 'y' && continueChoice.toLowerCase() !== 'yes') {
                    console.log('\nGoodbye!');
                    break;
                }
            }
            
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            if (this.client) {
                await this.client.disconnect();
            }
        }
    }

    async runMessageExport() {
        try {
            const selectedGroup = await this.selectGroup();
            
            const messageLimit = await input.text('Enter message limit (default 1000): ') || '1000';
            const exportFormat = await input.text('Enter export format (json/csv, default json): ') || 'json';
            
            const messages = await this.exportMessages(selectedGroup, parseInt(messageLimit));
            
            if (messages.length > 0) {
                await this.saveToFile(messages, selectedGroup.title, exportFormat);
                console.log('\nMessage export completed successfully!');
            } else {
                console.log('No messages found to export.');
            }
        } catch (error) {
            console.error('Error during message export:', error.message);
        }
    }

    async runContactsExport() {
        try {
            const exportFormat = await input.text('Enter export format (json/csv, default json): ') || 'json';
            
            await this.exportAllContacts(exportFormat);
            console.log('\nContacts export completed successfully!');
        } catch (error) {
            console.error('Error during contacts export:', error.message);
        }
    }

    async runMembersExport() {
        try {
            const selectedGroup = await this.selectGroup();
            
            const memberLimit = await input.text('Enter member limit (leave empty for all members): ');
            const exportFormat = await input.text('Enter export format (json/csv, default json): ') || 'json';
            
            const limit = memberLimit ? parseInt(memberLimit) : null;
            const filePath = await this.exportGroupMembers(selectedGroup, exportFormat, limit);
            
            if (filePath) {
                console.log('\nMembers export completed successfully!');
            }
        } catch (error) {
            console.error('Error during members export:', error.message);
        }
    }

    async runMessageMonitoring() {
        try {
            const selectedGroup = await this.selectGroup();
            
            const intervalStr = await input.text('Enter check interval in seconds (default 30): ') || '30';
            const interval = parseInt(intervalStr) * 1000;
            
            await this.monitorGroupMessages(selectedGroup, interval);
        } catch (error) {
            console.error('Error during message monitoring:', error.message);
        }
    }

    async runUpdateExistingFile() {
        try {
            console.log('\n=== Update Existing Message File ===');
            
            // Ищем JSON файлы с сообщениями в текущей директории
            const files = fs.readdirSync('.')
                .filter(file => file.endsWith('.json') && file.includes('_messages_'))
                .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime); // Сортируем по дате изменения
            
            if (files.length === 0) {
                console.log('No message export files found in current directory.');
                console.log('Please export messages first using option 1.');
                return;
            }
            
            console.log('\nFound message export files:');
            files.forEach((file, index) => {
                const stats = fs.statSync(file);
                console.log(`${index + 1}. ${file} (${stats.mtime.toLocaleString()})`);
            });
            
            const fileChoice = await input.text('\nSelect file number to update: ');
            const selectedFile = files[parseInt(fileChoice) - 1];
            
            if (!selectedFile) {
                console.log('Invalid file selection.');
                return;
            }
            
            // Загружаем существующие сообщения и определяем последнюю дату
            const existingMessages = await this.loadExistingMessages(selectedFile);
            const latestDate = await this.getLatestMessageDate(existingMessages);
            
            console.log(`\nFile: ${selectedFile}`);
            console.log(`Current messages: ${existingMessages.length}`);
            if (latestDate) {
                console.log(`Latest message date: ${latestDate.toLocaleString()}`);
            }
            
            // Выбираем группу (пытаемся определить по имени файла)
            const selectedGroup = await this.selectGroup();
            
            // Получаем новые сообщения
            const newMessages = await this.getNewMessages(selectedGroup, latestDate);
            
            if (newMessages.length === 0) {
                console.log('No new messages found since last export.');
                return;
            }
            
            console.log(`\nFound ${newMessages.length} new messages.`);
            const confirm = await input.text('Update the file with new messages? (y/n): ');
            
            if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                await this.updateExistingFile(selectedFile, newMessages);
                console.log('\nFile update completed successfully!');
            } else {
                console.log('Update cancelled.');
            }
            
        } catch (error) {
            console.error('Error during file update:', error.message);
        }
    }

    async runSessionManagement() {
        try {
            console.log('\n=== Session Management ===');
            console.log('1. View current session info');
            console.log('2. Clear saved session (force re-authentication)');
            console.log('3. Export current session string');
            console.log('4. Import session string');
            console.log('5. Back to main menu');
            
            const choice = await input.text('\nSelect option (1-5): ');
            
            switch (parseInt(choice)) {
                case 1:
                    await this.showSessionInfo();
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
                    console.log('Invalid choice.');
            }
        } catch (error) {
            console.error('Error in session management:', error.message);
        }
    }

    async showSessionInfo() {
        console.log('\n=== Session Information ===');
        
        if (fs.existsSync(this.sessionFile)) {
            const stats = fs.statSync(this.sessionFile);
            console.log(`Session file: ${this.sessionFile}`);
            console.log(`Created: ${stats.birthtime.toLocaleString()}`);
            console.log(`Last modified: ${stats.mtime.toLocaleString()}`);
            console.log('Status: Session file exists');
        } else {
            console.log('Status: No saved session found');
        }
        
        if (this.client && await this.client.checkAuthorization()) {
            try {
                const me = await this.client.getMe();
                console.log(`\nConnected as:`);
                console.log(`Name: ${me.firstName || ''} ${me.lastName || ''}`);
                console.log(`Username: @${me.username || 'not set'}`);
                console.log(`Phone: ${me.phone || 'not available'}`);
                console.log(`ID: ${me.id}`);
            } catch (error) {
                console.log('Could not get user info:', error.message);
            }
        } else {
            console.log('\nStatus: Not currently authenticated');
        }
    }

    async clearSavedSessionInteractive() {
        console.log('\n=== Clear Saved Session ===');
        console.log('This will force you to re-authenticate on next startup.');
        
        const confirm = await input.text('Are you sure? (y/n): ');
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
            this.clearSavedSession();
            console.log('Session cleared. You will need to re-authenticate on next startup.');
        } else {
            console.log('Operation cancelled.');
        }
    }

    async exportSessionString() {
        try {
            if (this.client && this.client.session) {
                const sessionString = this.client.session.save();
                console.log('\n=== Current Session String ===');
                console.log('Copy this string to backup your session:');
                console.log(sessionString);
                console.log('\nKeep this string safe - anyone with it can access your Telegram account!');
            } else {
                console.log('No active session to export.');
            }
        } catch (error) {
            console.error('Error exporting session:', error.message);
        }
    }

    async importSessionString() {
        try {
            console.log('\n=== Import Session String ===');
            console.log('Warning: This will replace your current session.');
            
            const sessionString = await input.text('Enter session string: ');
            if (sessionString && sessionString.trim()) {
                fs.writeFileSync(this.sessionFile, sessionString.trim(), 'utf8');
                console.log('Session string imported and saved.');
                console.log('Please restart the application to use the new session.');
            } else {
                console.log('Invalid session string.');
            }
        } catch (error) {
            console.error('Error importing session:', error.message);
        }
    }
}

if (require.main === module) {
    const exporter = new TelegramMessageExporter();
    exporter.run();
}
