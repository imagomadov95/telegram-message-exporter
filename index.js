
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
        console.log('4. Exit');
        
        const choice = await input.text('\nSelect option (1-4): ');
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
                        console.log('\nGoodbye!');
                        return;
                    default:
                        console.log('\nInvalid choice. Please select 1, 2, 3, or 4.');
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
}

if (require.main === module) {
    const exporter = new TelegramMessageExporter();
    exporter.run();
}
