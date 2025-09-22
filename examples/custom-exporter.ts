/**
 * Пример создания кастомного экспортера
 * Демонстрирует как расширить функционал приложения
 */

import { 
  TelegramClient,
  IMessageService, 
  IContactService,
  IFileService,
  DialogInfo,
  Message,
  ContactsExport,
  ExportFormat 
} from '../src/index';

interface AnalyticsReport {
  totalMessages: number;
  uniqueSenders: number;
  averageMessageLength: number;
  mostActiveUser: string;
  messagesByDay: Record<string, number>;
  topWords: Array<{ word: string; count: number }>;
}

interface CustomExportOptions {
  includeAnalytics: boolean;
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Кастомный экспортер с дополнительной аналитикой
 */
export class AdvancedMessageExporter {
  constructor(
    private messageService: IMessageService,
    private contactService: IContactService,
    private fileService: IFileService
  ) {}

  /**
   * Экспорт группы с аналитикой
   */
  async exportGroupWithAnalytics(
    group: DialogInfo, 
    options: CustomExportOptions = { includeAnalytics: true, format: 'json' }
  ): Promise<string> {
    console.log(`Starting advanced export for ${group.title}...`);

    // Получаем сообщения
    const messages = await this.messageService.exportMessages(group, {
      format: options.format,
      sinceDate: options.dateRange?.start
    });

    // Фильтруем по дате если указана
    const filteredMessages = this.filterMessagesByDateRange(messages, options.dateRange);

    // Генерируем аналитику если требуется
    let analytics: AnalyticsReport | null = null;
    if (options.includeAnalytics) {
      analytics = this.generateAnalytics(filteredMessages);
    }

    // Создаем расширенный экспорт
    const exportData = {
      groupInfo: {
        id: group.id,
        title: group.title,
        type: group.type,
        exportDate: new Date().toISOString(),
        messageCount: filteredMessages.length
      },
      messages: filteredMessages,
      analytics: analytics
    };

    // Сохраняем файл
    const fileName = `${group.title}_advanced_export`;
    const filePath = await this.fileService.saveToFile(exportData, fileName, options.format);
    
    console.log(`Advanced export completed: ${filePath}`);
    return filePath;
  }

  /**
   * Генерация аналитики по сообщениям
   */
  private generateAnalytics(messages: Message[]): AnalyticsReport {
    const senders = new Set<string>();
    const messagesByDay: Record<string, number> = {};
    const wordCounts: Record<string, number> = {};
    let totalLength = 0;

    messages.forEach(message => {
      // Отправители
      if (message.sender) {
        const senderName = `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || 
                          message.sender.username || 
                          `User_${message.sender.id}`;
        senders.add(senderName);
      }

      // Сообщения по дням
      const date = new Date(message.date).toISOString().split('T')[0];
      messagesByDay[date] = (messagesByDay[date] || 0) + 1;

      // Подсчет слов
      const words = message.text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) { // Игнорируем короткие слова
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });

      totalLength += message.text.length;
    });

    // Топ слова
    const topWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    // Самый активный пользователь
    const userMessageCounts: Record<string, number> = {};
    messages.forEach(message => {
      if (message.sender) {
        const senderName = `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || 
                          message.sender.username || 
                          `User_${message.sender.id}`;
        userMessageCounts[senderName] = (userMessageCounts[senderName] || 0) + 1;
      }
    });

    const mostActiveUser = Object.entries(userMessageCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    return {
      totalMessages: messages.length,
      uniqueSenders: senders.size,
      averageMessageLength: totalLength / messages.length,
      mostActiveUser,
      messagesByDay,
      topWords
    };
  }

  /**
   * Фильтрация сообщений по диапазону дат
   */
  private filterMessagesByDateRange(
    messages: Message[], 
    dateRange?: { start: Date; end: Date }
  ): Message[] {
    if (!dateRange) return messages;

    return messages.filter(message => {
      const messageDate = new Date(message.date);
      return messageDate >= dateRange.start && messageDate <= dateRange.end;
    });
  }

  /**
   * Экспорт нескольких групп одновременно
   */
  async exportMultipleGroups(
    groups: DialogInfo[], 
    options: CustomExportOptions = { includeAnalytics: true, format: 'json' }
  ): Promise<string[]> {
    console.log(`Exporting ${groups.length} groups...`);

    const results: string[] = [];
    
    for (const group of groups) {
      try {
        const filePath = await this.exportGroupWithAnalytics(group, options);
        results.push(filePath);
      } catch (error) {
        console.error(`Failed to export ${group.title}:`, error);
      }
    }

    console.log(`Completed export of ${results.length}/${groups.length} groups`);
    return results;
  }

  /**
   * Создание сводного отчета по всем группам
   */
  async createSummaryReport(groups: DialogInfo[]): Promise<string> {
    console.log('Creating summary report...');

    const summaryData = {
      reportDate: new Date().toISOString(),
      totalGroups: groups.length,
      groups: [] as any[]
    };

    for (const group of groups) {
      try {
        const messages = await this.messageService.exportMessages(group, { format: 'json' });
        const analytics = this.generateAnalytics(messages);

        summaryData.groups.push({
          id: group.id,
          title: group.title,
          type: group.type,
          messageCount: messages.length,
          analytics: {
            uniqueSenders: analytics.uniqueSenders,
            averageMessageLength: analytics.averageMessageLength,
            mostActiveUser: analytics.mostActiveUser
          }
        });
      } catch (error) {
        console.error(`Failed to analyze ${group.title}:`, error);
      }
    }

    const filePath = await this.fileService.saveToFile(summaryData, 'groups_summary_report', 'json');
    console.log(`Summary report created: ${filePath}`);
    return filePath;
  }
}

/**
 * Пример использования кастомного экспортера
 */
export async function exampleUsage() {
  // Это псевдокод - в реальном использовании нужно получить инстансы сервисов
  const messageService = {} as IMessageService; // получить из DI контейнера
  const contactService = {} as IContactService; // получить из DI контейнера  
  const fileService = {} as IFileService; // получить из DI контейнера

  const advancedExporter = new AdvancedMessageExporter(
    messageService,
    contactService, 
    fileService
  );

  // Пример группы
  const group: DialogInfo = {
    id: 123456789,
    title: 'Моя тестовая группа',
    type: 'group',
    participantsCount: 50
  };

  // Экспорт с аналитикой
  await advancedExporter.exportGroupWithAnalytics(group, {
    includeAnalytics: true,
    format: 'json',
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    }
  });

  // Экспорт нескольких групп
  const groups = [group]; // массив групп
  await advancedExporter.exportMultipleGroups(groups);

  // Создание сводного отчета
  await advancedExporter.createSummaryReport(groups);
}