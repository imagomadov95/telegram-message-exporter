import { Api, TelegramClient } from 'telegram';
import { ContactsExport, ExportFormat, ContactInfo, BotInfo, GroupInfo, ChannelInfo } from '../models/types';
import { IContactService } from '../models/interfaces';
import { FileService } from '../utils/file-service';

export class ContactService implements IContactService {
  private client: TelegramClient;
  private fileService: FileService;

  constructor(client: TelegramClient, fileService: FileService) {
    this.client = client;
    this.fileService = fileService;
  }

  async getAllContacts(): Promise<ContactsExport> {
    console.log('\nGetting all contacts, groups, and channels...');
    
    const allDialogs = await this.client.getDialogs();
    
    const contacts = await this.client.invoke(new Api.contacts.GetContacts({
      hash: 0
    }));

    const result: ContactsExport = {
      contacts: [],
      groups: [],
      channels: [],
      bots: []
    };

    if (contacts.users) {
      contacts.users.forEach(user => {
        const contactInfo: ContactInfo | BotInfo = {
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
          result.bots.push({ ...contactInfo, isBot: true } as BotInfo);
        } else {
          result.contacts.push(contactInfo as ContactInfo);
        }
      });
    }

    allDialogs.forEach(dialog => {
      if (dialog.isGroup) {
        const groupInfo: GroupInfo = {
          id: dialog.entity.id,
          title: dialog.title,
          username: dialog.entity.username || '',
          participantsCount: dialog.entity.participantsCount || 0,
          type: 'group',
          isCreator: dialog.entity.creator || false,
          hasGeo: dialog.entity.hasGeo || false,
          restrictionReason: dialog.entity.restrictionReason || null
        };
        result.groups.push(groupInfo);
      } else if (dialog.isChannel) {
        const channelInfo: ChannelInfo = {
          id: dialog.entity.id,
          title: dialog.title,
          username: dialog.entity.username || '',
          participantsCount: dialog.entity.participantsCount || 0,
          type: 'channel',
          isBroadcast: dialog.entity.broadcast || false,
          isMegagroup: dialog.entity.megagroup || false,
          isVerified: dialog.entity.verified || false,
          restrictionReason: dialog.entity.restrictionReason || null
        };
        result.channels.push(channelInfo);
      }
    });

    console.log(`Found ${result.contacts.length} contacts, ${result.groups.length} groups, ${result.channels.length} channels, ${result.bots.length} bots`);
    return result;
  }

  async exportAllContacts(format: ExportFormat = 'json'): Promise<string> {
    const allContacts = await this.getAllContacts();
    const filePath = await this.fileService.saveToFile(allContacts, 'telegram_contacts', format);
    console.log(`All contacts exported to: ${filePath}`);
    return filePath;
  }

  async getContactById(userId: number): Promise<ContactInfo | null> {
    try {
      const user = await this.client.getEntity(userId);
      
      if ('firstName' in user) {
        return {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          username: user.username || '',
          phone: user.phone || '',
          isBot: user.bot || false,
          isPremium: user.premium || false,
          isVerified: user.verified || false,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting contact by ID:', error);
      return null;
    }
  }

  async searchContacts(query: string): Promise<ContactInfo[]> {
    try {
      const result = await this.client.invoke(new Api.contacts.Search({
        q: query,
        limit: 100
      }));

      const contacts: ContactInfo[] = [];
      
      if (result.users) {
        result.users.forEach(user => {
          if (!user.bot) {
            contacts.push({
              id: user.id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              username: user.username || '',
              phone: user.phone || '',
              isBot: user.bot || false,
              isPremium: user.premium || false,
              isVerified: user.verified || false,
            });
          }
        });
      }

      return contacts;
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }

  private formatContactsForDisplay(contacts: ContactsExport): void {
    console.log('\n=== Export Summary ===');
    console.log(`Contacts: ${contacts.contacts.length}`);
    console.log(`Bots: ${contacts.bots.length}`);
    console.log(`Groups: ${contacts.groups.length}`);
    console.log(`Channels: ${contacts.channels.length}`);
    console.log(`Total: ${contacts.contacts.length + contacts.bots.length + contacts.groups.length + contacts.channels.length}`);
  }
}