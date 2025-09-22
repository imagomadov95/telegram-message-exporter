import * as fs from 'fs';
import { ExportFormat, Message, GroupMember, ContactsExport } from '../models/types';
import { IFileService } from '../models/interfaces';

export class FileService implements IFileService {
  
  async saveToFile(data: any, fileName: string, format: ExportFormat = 'json'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFileName = this.sanitizeFileName(fileName);
    
    let filePath: string;
    let content: string;

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

  findMessageFiles(): string[] {
    try {
      return fs.readdirSync('.')
        .filter(file => file.endsWith('.json') && file.includes('_messages_'))
        .sort((a, b) => {
          const statA = fs.statSync(a);
          const statB = fs.statSync(b);
          return statB.mtime.getTime() - statA.mtime.getTime();
        });
    } catch (error) {
      console.error('Error finding message files:', error);
      return [];
    }
  }

  createBackup(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        const backupPath = filePath.replace(/\.json$/, '_backup.json');
        fs.copyFileSync(filePath, backupPath);
        console.log(`Backup created: ${backupPath}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^\w\s]/gi, '_').replace(/\s+/g, '_');
  }

  private convertToCSV(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      if (this.isMessageArray(data)) {
        return this.convertMessagesToCSV(data as Message[]);
      }
      
      if (this.isMemberArray(data)) {
        return this.convertMembersToCSV(data as GroupMember[]);
      }
    }
    
    if (this.isContactsExport(data)) {
      return this.convertContactsToCSV(data as ContactsExport);
    }

    throw new Error('Unsupported data format for CSV conversion');
  }

  private isMessageArray(data: any[]): boolean {
    return data.length > 0 && 'text' in data[0] && 'date' in data[0];
  }

  private isMemberArray(data: any[]): boolean {
    return data.length > 0 && 'role' in data[0] && 'id' in data[0];
  }

  private isContactsExport(data: any): boolean {
    return data && typeof data === 'object' && 
           'contacts' in data && 'groups' in data && 'channels' in data && 'bots' in data;
  }

  private convertMessagesToCSV(messages: Message[]): string {
    const header = 'ID,Date,Sender,Username,Text,IsForwarded,HasMedia,MediaType\n';
    const rows = messages.map(msg => {
      const sender = msg.sender ? `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim() : '';
      const username = msg.sender?.username || '';
      const text = this.escapeCSV(msg.text);
      return `${msg.id},"${msg.date}","${sender}","${username}","${text}",${msg.isForwarded || false},${msg.hasMedia || false},"${msg.mediaType || ''}"`;
    }).join('\n');
    return header + rows;
  }

  private convertMembersToCSV(members: GroupMember[]): string {
    const header = 'ID,FirstName,LastName,Username,Phone,Role,IsBot,IsPremium,IsVerified,IsDeleted,IsContact,JoinDate,LastSeenStatus\n';
    const rows = members.map(member => {
      const firstName = this.escapeCSV(member.firstName || '');
      const lastName = this.escapeCSV(member.lastName || '');
      const username = this.escapeCSV(member.username || '');
      return `${member.id},"${firstName}","${lastName}","${username}","${member.phone || ''}","${member.role}",${member.isBot || false},${member.isPremium || false},${member.isVerified || false},${member.isDeleted || false},${member.isContact || false},"${member.joinDate || ''}","${member.lastSeenStatus || ''}"`;
    }).join('\n');
    return header + rows;
  }

  private convertContactsToCSV(contacts: ContactsExport): string {
    const header = 'Type,ID,Name,Username,Phone,Title,ParticipantsCount,IsBot,IsPremium,IsVerified,IsBroadcast,IsMegagroup\n';
    
    let rows: string[] = [];
    
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

  private escapeCSV(text: string): string {
    return text.replace(/"/g, '""').replace(/\n/g, ' ');
  }
}