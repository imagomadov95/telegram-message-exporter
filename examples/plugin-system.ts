/**
 * Пример системы плагинов для расширения функционала
 * Демонстрирует паттерн Plugin и Observer
 */

import { Message, DialogInfo, GroupMember } from '../src/index';

// Базовый интерфейс для всех плагинов
export interface IPlugin {
  readonly name: string;
  readonly version: string;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

// Интерфейс для плагинов обработки сообщений
export interface IMessagePlugin extends IPlugin {
  onMessageReceived(message: Message, group: DialogInfo): Promise<void>;
  onMessagesExported(messages: Message[], group: DialogInfo): Promise<void>;
}

// Интерфейс для плагинов аналитики
export interface IAnalyticsPlugin extends IPlugin {
  analyzeMessages(messages: Message[]): Promise<any>;
  generateReport(data: any): Promise<string>;
}

// Интерфейс для плагинов фильтрации
export interface IFilterPlugin extends IPlugin {
  filterMessages(messages: Message[], criteria: any): Promise<Message[]>;
  filterMembers(members: GroupMember[], criteria: any): Promise<GroupMember[]>;
}

/**
 * Менеджер плагинов
 */
export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();
  private messagePlugins: IMessagePlugin[] = [];
  private analyticsPlugins: IAnalyticsPlugin[] = [];
  private filterPlugins: IFilterPlugin[] = [];

  /**
   * Регистрация плагина
   */
  async registerPlugin(plugin: IPlugin): Promise<void> {
    console.log(`Registering plugin: ${plugin.name} v${plugin.version}`);
    
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    await plugin.initialize();
    this.plugins.set(plugin.name, plugin);

    // Распределяем по типам
    if (this.isMessagePlugin(plugin)) {
      this.messagePlugins.push(plugin);
    }
    if (this.isAnalyticsPlugin(plugin)) {
      this.analyticsPlugins.push(plugin);
    }
    if (this.isFilterPlugin(plugin)) {
      this.filterPlugins.push(plugin);
    }

    console.log(`Plugin ${plugin.name} registered successfully`);
  }

  /**
   * Удаление плагина
   */
  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    await plugin.cleanup();
    this.plugins.delete(name);

    // Удаляем из списков по типам
    this.messagePlugins = this.messagePlugins.filter(p => p.name !== name);
    this.analyticsPlugins = this.analyticsPlugins.filter(p => p.name !== name);
    this.filterPlugins = this.filterPlugins.filter(p => p.name !== name);

    console.log(`Plugin ${name} unregistered successfully`);
  }

  /**
   * Уведомление о новом сообщении
   */
  async notifyMessageReceived(message: Message, group: DialogInfo): Promise<void> {
    const promises = this.messagePlugins.map(plugin => 
      plugin.onMessageReceived(message, group).catch(error => 
        console.error(`Error in plugin ${plugin.name}:`, error)
      )
    );
    await Promise.all(promises);
  }

  /**
   * Уведомление об экспорте сообщений
   */
  async notifyMessagesExported(messages: Message[], group: DialogInfo): Promise<void> {
    const promises = this.messagePlugins.map(plugin => 
      plugin.onMessagesExported(messages, group).catch(error => 
        console.error(`Error in plugin ${plugin.name}:`, error)
      )
    );
    await Promise.all(promises);
  }

  /**
   * Применение фильтров к сообщениям
   */
  async applyMessageFilters(messages: Message[], criteria: any): Promise<Message[]> {
    let filteredMessages = messages;
    
    for (const plugin of this.filterPlugins) {
      try {
        filteredMessages = await plugin.filterMessages(filteredMessages, criteria);
      } catch (error) {
        console.error(`Error in filter plugin ${plugin.name}:`, error);
      }
    }
    
    return filteredMessages;
  }

  /**
   * Запуск аналитики
   */
  async runAnalytics(messages: Message[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const plugin of this.analyticsPlugins) {
      try {
        results[plugin.name] = await plugin.analyzeMessages(messages);
      } catch (error) {
        console.error(`Error in analytics plugin ${plugin.name}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Получение списка плагинов
   */
  getPluginList(): Array<{ name: string; version: string; type: string }> {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      type: this.getPluginType(plugin)
    }));
  }

  private isMessagePlugin(plugin: IPlugin): plugin is IMessagePlugin {
    return 'onMessageReceived' in plugin && 'onMessagesExported' in plugin;
  }

  private isAnalyticsPlugin(plugin: IPlugin): plugin is IAnalyticsPlugin {
    return 'analyzeMessages' in plugin && 'generateReport' in plugin;
  }

  private isFilterPlugin(plugin: IPlugin): plugin is IFilterPlugin {
    return 'filterMessages' in plugin && 'filterMembers' in plugin;
  }

  private getPluginType(plugin: IPlugin): string {
    const types: string[] = [];
    if (this.isMessagePlugin(plugin)) types.push('Message');
    if (this.isAnalyticsPlugin(plugin)) types.push('Analytics');
    if (this.isFilterPlugin(plugin)) types.push('Filter');
    return types.join(', ') || 'Unknown';
  }
}

/**
 * Примеры плагинов
 */

// Плагин для логирования сообщений
export class MessageLoggerPlugin implements IMessagePlugin {
  readonly name = 'MessageLogger';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    console.log('MessageLogger plugin initialized');
  }

  async cleanup(): Promise<void> {
    console.log('MessageLogger plugin cleaned up');
  }

  async onMessageReceived(message: Message, group: DialogInfo): Promise<void> {
    console.log(`[${group.title}] New message from ${message.sender?.firstName}: ${message.text.substring(0, 50)}...`);
  }

  async onMessagesExported(messages: Message[], group: DialogInfo): Promise<void> {
    console.log(`Exported ${messages.length} messages from ${group.title}`);
  }
}

// Плагин для статистики
export class StatisticsPlugin implements IAnalyticsPlugin {
  readonly name = 'Statistics';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    console.log('Statistics plugin initialized');
  }

  async cleanup(): Promise<void> {
    console.log('Statistics plugin cleaned up');
  }

  async analyzeMessages(messages: Message[]): Promise<any> {
    const stats = {
      totalMessages: messages.length,
      averageLength: messages.reduce((sum, msg) => sum + msg.text.length, 0) / messages.length,
      messagesWithMedia: messages.filter(msg => msg.hasMedia).length,
      forwardedMessages: messages.filter(msg => msg.isForwarded).length,
      uniqueSenders: new Set(messages.map(msg => msg.sender?.id)).size
    };

    return stats;
  }

  async generateReport(data: any): Promise<string> {
    return `
Statistics Report:
- Total Messages: ${data.totalMessages}
- Average Length: ${data.averageLength.toFixed(2)} characters
- Messages with Media: ${data.messagesWithMedia}
- Forwarded Messages: ${data.forwardedMessages}
- Unique Senders: ${data.uniqueSenders}
    `.trim();
  }
}

// Плагин для фильтрации по ключевым словам
export class KeywordFilterPlugin implements IFilterPlugin {
  readonly name = 'KeywordFilter';
  readonly version = '1.0.0';
  
  private keywords: string[] = [];

  constructor(keywords: string[] = []) {
    this.keywords = keywords.map(k => k.toLowerCase());
  }

  async initialize(): Promise<void> {
    console.log(`KeywordFilter plugin initialized with keywords: ${this.keywords.join(', ')}`);
  }

  async cleanup(): Promise<void> {
    console.log('KeywordFilter plugin cleaned up');
  }

  async filterMessages(messages: Message[], criteria: any): Promise<Message[]> {
    if (!criteria.keywords && this.keywords.length === 0) {
      return messages;
    }

    const keywordsToFilter = criteria.keywords || this.keywords;
    
    return messages.filter(message => {
      const text = message.text.toLowerCase();
      return keywordsToFilter.some((keyword: string) => text.includes(keyword.toLowerCase()));
    });
  }

  async filterMembers(members: GroupMember[], criteria: any): Promise<GroupMember[]> {
    if (!criteria.keywords) {
      return members;
    }

    return members.filter(member => {
      const fullName = `${member.firstName} ${member.lastName} ${member.username}`.toLowerCase();
      return criteria.keywords.some((keyword: string) => fullName.includes(keyword.toLowerCase()));
    });
  }

  setKeywords(keywords: string[]): void {
    this.keywords = keywords.map(k => k.toLowerCase());
  }
}

// Плагин для экспорта в кастомные форматы
export class CustomExportPlugin implements IMessagePlugin {
  readonly name = 'CustomExport';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    console.log('CustomExport plugin initialized');
  }

  async cleanup(): Promise<void> {
    console.log('CustomExport plugin cleaned up');
  }

  async onMessageReceived(message: Message, group: DialogInfo): Promise<void> {
    // Можно сохранять в реальном времени в кастомный формат
  }

  async onMessagesExported(messages: Message[], group: DialogInfo): Promise<void> {
    // Экспорт в XML формат
    const xmlContent = this.convertToXML(messages, group);
    const fs = require('fs');
    const fileName = `${group.title}_custom_export.xml`;
    fs.writeFileSync(fileName, xmlContent, 'utf8');
    console.log(`Custom XML export created: ${fileName}`);
  }

  private convertToXML(messages: Message[], group: DialogInfo): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<export>\n`;
    xml += `  <group id="${group.id}" title="${this.escapeXML(group.title)}" type="${group.type}"/>\n`;
    xml += `  <messages count="${messages.length}">\n`;
    
    messages.forEach(message => {
      xml += `    <message id="${message.id}" date="${message.date}">\n`;
      xml += `      <text>${this.escapeXML(message.text)}</text>\n`;
      if (message.sender) {
        xml += `      <sender id="${message.sender.id}" name="${this.escapeXML(`${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim())}" username="${this.escapeXML(message.sender.username || '')}"/>\n`;
      }
      xml += `      <flags forwarded="${message.isForwarded}" hasMedia="${message.hasMedia}"/>\n`;
      xml += `    </message>\n`;
    });
    
    xml += `  </messages>\n`;
    xml += `</export>`;
    
    return xml;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Пример использования системы плагинов
 */
export async function demonstratePluginSystem() {
  const pluginManager = new PluginManager();

  // Регистрируем плагины
  await pluginManager.registerPlugin(new MessageLoggerPlugin());
  await pluginManager.registerPlugin(new StatisticsPlugin());
  await pluginManager.registerPlugin(new KeywordFilterPlugin(['важно', 'срочно']));
  await pluginManager.registerPlugin(new CustomExportPlugin());

  // Выводим список плагинов
  console.log('Registered plugins:', pluginManager.getPluginList());

  // Пример сообщений
  const messages: Message[] = [
    {
      id: 1,
      date: new Date().toISOString(),
      text: 'Важное сообщение о работе',
      sender: { id: 123, firstName: 'Иван', lastName: 'Петров' }
    },
    {
      id: 2,
      date: new Date().toISOString(),
      text: 'Обычное сообщение',
      sender: { id: 124, firstName: 'Мария', lastName: 'Сидорова' }
    }
  ];

  const group: DialogInfo = {
    id: 456,
    title: 'Тестовая группа',
    type: 'group'
  };

  // Применяем фильтры
  const filteredMessages = await pluginManager.applyMessageFilters(messages, {
    keywords: ['важно']
  });
  console.log(`Filtered ${messages.length} -> ${filteredMessages.length} messages`);

  // Запускаем аналитику
  const analytics = await pluginManager.runAnalytics(filteredMessages);
  console.log('Analytics results:', analytics);

  // Уведомляем об экспорте
  await pluginManager.notifyMessagesExported(filteredMessages, group);

  // Очистка
  await pluginManager.unregisterPlugin('MessageLogger');
  await pluginManager.unregisterPlugin('Statistics');
  await pluginManager.unregisterPlugin('KeywordFilter');
  await pluginManager.unregisterPlugin('CustomExport');
}