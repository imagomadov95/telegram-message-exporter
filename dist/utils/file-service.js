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
exports.FileService = void 0;
const fs = __importStar(require("fs"));
class FileService {
    async saveToFile(data, fileName, format = 'json') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseFileName = this.sanitizeFileName(fileName);
        let filePath;
        let content;
        switch (format.toLowerCase()) {
            case 'json':
                filePath = `${baseFileName}_${timestamp}.json`;
                content = JSON.stringify(data, null, 2);
                break;
            case 'csv':
                filePath = `${baseFileName}_${timestamp}.csv`;
                content = this.convertToCSV(data);
                break;
            default:
                throw new Error('Unsupported format. Use "json" or "csv"');
        }
        fs.writeFileSync(filePath, content, 'utf8');
        return filePath;
    }
    findMessageFiles() {
        try {
            return fs.readdirSync('.')
                .filter(file => file.endsWith('.json') && file.includes('_messages_'))
                .sort((a, b) => {
                const statA = fs.statSync(a);
                const statB = fs.statSync(b);
                return statB.mtime.getTime() - statA.mtime.getTime();
            });
        }
        catch (error) {
            console.error('Error finding message files:', error);
            return [];
        }
    }
    createBackup(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const backupPath = filePath.replace(/\.json$/, '_backup.json');
                fs.copyFileSync(filePath, backupPath);
                console.log(`Backup created: ${backupPath}`);
            }
        }
        catch (error) {
            console.error('Error creating backup:', error);
        }
    }
    sanitizeFileName(fileName) {
        return fileName.replace(/[^\w\s]/gi, '_').replace(/\s+/g, '_');
    }
    convertToCSV(data) {
        if (Array.isArray(data)) {
            if (data.length === 0)
                return '';
            if (this.isMessageArray(data)) {
                return this.convertMessagesToCSV(data);
            }
            if (this.isMemberArray(data)) {
                return this.convertMembersToCSV(data);
            }
        }
        if (this.isContactsExport(data)) {
            return this.convertContactsToCSV(data);
        }
        throw new Error('Unsupported data format for CSV conversion');
    }
    isMessageArray(data) {
        return data.length > 0 && 'text' in data[0] && 'date' in data[0];
    }
    isMemberArray(data) {
        return data.length > 0 && 'role' in data[0] && 'id' in data[0];
    }
    isContactsExport(data) {
        return data && typeof data === 'object' &&
            'contacts' in data && 'groups' in data && 'channels' in data && 'bots' in data;
    }
    convertMessagesToCSV(messages) {
        const header = 'ID,Date,Sender,Username,Text,IsForwarded,HasMedia,MediaType\n';
        const rows = messages.map(msg => {
            const sender = msg.sender ? `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim() : '';
            const username = msg.sender?.username || '';
            const text = this.escapeCSV(msg.text);
            return `${msg.id},"${msg.date}","${sender}","${username}","${text}",${msg.isForwarded || false},${msg.hasMedia || false},"${msg.mediaType || ''}"`;
        }).join('\n');
        return header + rows;
    }
    convertMembersToCSV(members) {
        const header = 'ID,FirstName,LastName,Username,Phone,Role,IsBot,IsPremium,IsVerified,IsDeleted,IsContact,JoinDate,LastSeenStatus\n';
        const rows = members.map(member => {
            const firstName = this.escapeCSV(member.firstName || '');
            const lastName = this.escapeCSV(member.lastName || '');
            const username = this.escapeCSV(member.username || '');
            return `${member.id},"${firstName}","${lastName}","${username}","${member.phone || ''}","${member.role}",${member.isBot || false},${member.isPremium || false},${member.isVerified || false},${member.isDeleted || false},${member.isContact || false},"${member.joinDate || ''}","${member.lastSeenStatus || ''}"`;
        }).join('\n');
        return header + rows;
    }
    convertContactsToCSV(contacts) {
        const header = 'Type,ID,Name,Username,Phone,Title,ParticipantsCount,IsBot,IsPremium,IsVerified,IsBroadcast,IsMegagroup\n';
        let rows = [];
        contacts.contacts.forEach(contact => {
            const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
            rows.push(`Contact,${contact.id},"${name}","${contact.username || ''}","${contact.phone || ''}","","",${contact.isBot || false},${contact.isPremium || false},${contact.isVerified || false},"",""`);
        });
        contacts.bots.forEach(bot => {
            const name = `${bot.firstName || ''} ${bot.lastName || ''}`.trim();
            rows.push(`Bot,${bot.id},"${name}","${bot.username || ''}","${bot.phone || ''}","","",${bot.isBot || false},${bot.isPremium || false},${bot.isVerified || false},"",""`);
        });
        contacts.groups.forEach(group => {
            rows.push(`Group,${group.id},"","${group.username || ''}","","${group.title}",${group.participantsCount || 0},"","","","",""`);
        });
        contacts.channels.forEach(channel => {
            rows.push(`Channel,${channel.id},"","${channel.username || ''}","","${channel.title}",${channel.participantsCount || 0},"","",${channel.isVerified || false},${channel.isBroadcast || false},${channel.isMegagroup || false}`);
        });
        return header + rows.join('\n');
    }
    escapeCSV(text) {
        return text.replace(/"/g, '""').replace(/\n/g, ' ');
    }
}
exports.FileService = FileService;
//# sourceMappingURL=file-service.js.map