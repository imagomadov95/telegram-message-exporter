import { TelegramClient } from 'telegram';
import * as input from 'input';
import { DialogInfo, GroupInfo, ChannelInfo } from '../models/types';
import { IDialogService } from '../models/interfaces';

export class DialogService implements IDialogService {
  private client: TelegramClient;

  constructor(client: TelegramClient) {
    this.client = client;
  }

  async getDialogs(): Promise<DialogInfo[]> {
    const dialogs = await this.client.getDialogs();
    return dialogs.filter(dialog => 
      dialog.isGroup || dialog.isChannel
    ).map(dialog => this.mapDialogToInfo(dialog));
  }

  async selectGroup(): Promise<DialogInfo> {
    const groups = await this.getDialogs();
    
    console.log('\nAvailable groups and channels:');
    groups.forEach((group, index) => {
      const type = group.type === 'channel' ? 'Channel' : 'Group';
      const memberCount = group.participantsCount ? ` (${group.participantsCount} members)` : '';
      console.log(`${index + 1}. ${group.title} (${type})${memberCount}`);
    });

    const choice = await input.text('\nSelect group number: ');
    const selectedGroup = groups[parseInt(choice, 10) - 1];
    
    if (!selectedGroup) {
      throw new Error('Invalid selection');
    }

    return selectedGroup;
  }

  async getGroupByTitle(title: string): Promise<DialogInfo | null> {
    const dialogs = await this.getDialogs();
    return dialogs.find(dialog => 
      dialog.title.toLowerCase().includes(title.toLowerCase())
    ) || null;
  }

  async getGroupById(id: number): Promise<DialogInfo | null> {
    try {
      const entity = await this.client.getEntity(id);
      
      if ('title' in entity) {
        return this.mapEntityToDialogInfo(entity);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting group by ID:', error);
      return null;
    }
  }

  async searchGroups(query: string): Promise<DialogInfo[]> {
    const dialogs = await this.getDialogs();
    return dialogs.filter(dialog =>
      dialog.title.toLowerCase().includes(query.toLowerCase()) ||
      (dialog.username && dialog.username.toLowerCase().includes(query.toLowerCase()))
    );
  }

  private mapDialogToInfo(dialog: any): DialogInfo {
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
      return groupInfo;
    } else {
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
      return channelInfo;
    }
  }

  private mapEntityToDialogInfo(entity: any): DialogInfo {
    if (entity.className === 'Chat' || entity.className === 'ChatForbidden') {
      const groupInfo: GroupInfo = {
        id: entity.id,
        title: entity.title,
        username: entity.username || '',
        participantsCount: entity.participantsCount || 0,
        type: 'group',
        isCreator: entity.creator || false,
        hasGeo: entity.hasGeo || false,
        restrictionReason: entity.restrictionReason || null
      };
      return groupInfo;
    } else {
      const channelInfo: ChannelInfo = {
        id: entity.id,
        title: entity.title,
        username: entity.username || '',
        participantsCount: entity.participantsCount || 0,
        type: 'channel',
        isBroadcast: entity.broadcast || false,
        isMegagroup: entity.megagroup || false,
        isVerified: entity.verified || false,
        restrictionReason: entity.restrictionReason || null
      };
      return channelInfo;
    }
  }

  displayGroupInfo(group: DialogInfo): void {
    console.log(`\n=== Group Information ===`);
    console.log(`Title: ${group.title}`);
    console.log(`Type: ${group.type}`);
    console.log(`ID: ${group.id}`);
    console.log(`Username: ${group.username || 'Not set'}`);
    console.log(`Members: ${group.participantsCount || 'Unknown'}`);
    
    if (group.type === 'channel') {
      const channel = group as ChannelInfo;
      console.log(`Broadcast: ${channel.isBroadcast ? 'Yes' : 'No'}`);
      console.log(`Megagroup: ${channel.isMegagroup ? 'Yes' : 'No'}`);
      console.log(`Verified: ${channel.isVerified ? 'Yes' : 'No'}`);
    } else {
      const groupEntity = group as GroupInfo;
      console.log(`Creator: ${groupEntity.isCreator ? 'Yes' : 'No'}`);
      console.log(`Has Geo: ${groupEntity.hasGeo ? 'Yes' : 'No'}`);
    }
  }
}