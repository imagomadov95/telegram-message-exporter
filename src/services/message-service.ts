import * as fs from 'fs';
import { TelegramClient } from 'telegram';
import { DialogInfo, Message, MessageSender, ExportOptions } from '../models/types';
import { IMessageService } from '../models/interfaces';
import { FileService } from '../utils/file-service';

export class MessageService implements IMessageService {
  private client: TelegramClient;
  private fileService: FileService;

  constructor(client: TelegramClient, fileService: FileService) {
    this.client = client;
    this.fileService = fileService;
  }

  async exportMessages(group: DialogInfo, options: ExportOptions = { format: 'json' }): Promise<Message[]> {
    console.log(`\nExporting messages from "${group.title}"...`);
    
    const messages: Message[] = [];
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

  async getNewMessages(group: DialogInfo, sinceDate: Date | null = null, limit: number = 1000): Promise<Message[]> {
    console.log(`\nGetting new messages from "${group.title}"${sinceDate ? ` since ${sinceDate.toLocaleString()}` : ''}...`);
    
    const messages: Message[] = [];
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

  async loadExistingMessages(filePath: string): Promise<Message[]> {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        return data as Message[];
      }
      
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error loading existing messages:', errorMessage);
      return [];
    }
  }

  async updateExistingFile(filePath: string, newMessages: Message[]): Promise<void> {
    if (newMessages.length === 0) {
      console.log('No new messages to add.');
      return;
    }

    try {
      const existingMessages = await this.loadExistingMessages(filePath);
      const allMessages = [...existingMessages, ...newMessages];
      
      const uniqueMessages = allMessages.filter((msg, index, arr) => 
        arr.findIndex(m => m.id === msg.id) === index
      );
      
      uniqueMessages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      this.fileService.createBackup(filePath);
      
      fs.writeFileSync(filePath, JSON.stringify(uniqueMessages, null, 2), 'utf8');
      console.log(`Updated ${filePath} with ${newMessages.length} new messages`);
      console.log(`Total messages in file: ${uniqueMessages.length}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating file:', errorMessage);
      throw error;
    }
  }

  async monitorGroupMessages(group: DialogInfo, options: { checkInterval: number; isRunning: boolean }): Promise<void> {
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
        
        if (!isRunning) break;
        
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
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error during monitoring:', errorMessage);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('Message monitoring stopped.');
  }

  async getLatestMessageDate(messages: Message[]): Promise<Date | null> {
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

  private mapTelegramMessage(telegramMessage: any): Message {
    const message: Message = {
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

  private formatSenderName(sender: MessageSender | null | undefined): string {
    if (!sender) return 'Unknown';
    
    const name = `${sender.firstName || ''} ${sender.lastName || ''}`.trim();
    if (name) return name;
    
    if (sender.username) return `@${sender.username}`;
    
    return `User ${sender.id}`;
  }
}