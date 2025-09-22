/**
 * Примеры расширенных фильтров для сообщений и участников
 * Демонстрирует паттерн Strategy и Chain of Responsibility
 */

import { Message, GroupMember, DialogInfo } from '../src/index';

// Базовый интерфейс для фильтров
export interface IFilter<T> {
  filter(items: T[], context?: any): T[];
}

// Интерфейс для составных фильтров
export interface ICompositeFilter<T> extends IFilter<T> {
  addFilter(filter: IFilter<T>): void;
  removeFilter(filter: IFilter<T>): void;
}

/**
 * Составной фильтр с поддержкой цепочки фильтров
 */
export class CompositeFilter<T> implements ICompositeFilter<T> {
  private filters: IFilter<T>[] = [];

  addFilter(filter: IFilter<T>): void {
    this.filters.push(filter);
  }

  removeFilter(filter: IFilter<T>): void {
    const index = this.filters.indexOf(filter);
    if (index > -1) {
      this.filters.splice(index, 1);
    }
  }

  filter(items: T[], context?: any): T[] {
    return this.filters.reduce((filteredItems, filter) => {
      return filter.filter(filteredItems, context);
    }, items);
  }
}

/**
 * Фильтры для сообщений
 */

// Фильтр по дате
export class DateRangeMessageFilter implements IFilter<Message> {
  constructor(
    private startDate: Date,
    private endDate: Date
  ) {}

  filter(messages: Message[]): Message[] {
    return messages.filter(message => {
      const messageDate = new Date(message.date);
      return messageDate >= this.startDate && messageDate <= this.endDate;
    });
  }
}

// Фильтр по ключевым словам
export class KeywordMessageFilter implements IFilter<Message> {
  constructor(
    private keywords: string[],
    private caseSensitive: boolean = false,
    private matchMode: 'any' | 'all' = 'any'
  ) {}

  filter(messages: Message[]): Message[] {
    return messages.filter(message => {
      const text = this.caseSensitive ? message.text : message.text.toLowerCase();
      const keywords = this.caseSensitive ? this.keywords : this.keywords.map(k => k.toLowerCase());

      if (this.matchMode === 'all') {
        return keywords.every(keyword => text.includes(keyword));
      } else {
        return keywords.some(keyword => text.includes(keyword));
      }
    });
  }
}

// Фильтр по отправителю
export class SenderMessageFilter implements IFilter<Message> {
  constructor(
    private senderIds: number[] = [],
    private senderUsernames: string[] = [],
    private exclude: boolean = false
  ) {}

  filter(messages: Message[]): Message[] {
    return messages.filter(message => {
      if (!message.sender) return !this.exclude;

      const matchesId = this.senderIds.length === 0 || this.senderIds.includes(message.sender.id);
      const matchesUsername = this.senderUsernames.length === 0 || 
        (message.sender.username && this.senderUsernames.includes(message.sender.username));

      const matches = matchesId && matchesUsername;
      return this.exclude ? !matches : matches;
    });
  }
}

// Фильтр по типу сообщения
export class MessageTypeFilter implements IFilter<Message> {
  constructor(
    private includeForwarded: boolean = true,
    private includeWithMedia: boolean = true,
    private includeTextOnly: boolean = true,
    private minLength: number = 0,
    private maxLength: number = Infinity
  ) {}

  filter(messages: Message[]): Message[] {
    return messages.filter(message => {
      // Проверка пересланных сообщений
      if (message.isForwarded && !this.includeForwarded) {
        return false;
      }

      // Проверка сообщений с медиа
      if (message.hasMedia && !this.includeWithMedia) {
        return false;
      }

      // Проверка текстовых сообщений
      if (!message.hasMedia && !this.includeTextOnly) {
        return false;
      }

      // Проверка длины
      const textLength = message.text.length;
      if (textLength < this.minLength || textLength > this.maxLength) {
        return false;
      }

      return true;
    });
  }
}

// Фильтр по регулярному выражению
export class RegexMessageFilter implements IFilter<Message> {
  constructor(
    private pattern: RegExp,
    private searchInSenderName: boolean = false
  ) {}

  filter(messages: Message[]): Message[] {
    return messages.filter(message => {
      // Поиск в тексте сообщения
      if (this.pattern.test(message.text)) {
        return true;
      }

      // Поиск в имени отправителя
      if (this.searchInSenderName && message.sender) {
        const senderName = `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim();
        const username = message.sender.username || '';
        
        if (this.pattern.test(senderName) || this.pattern.test(username)) {
          return true;
        }
      }

      return false;
    });
  }
}

/**
 * Фильтры для участников
 */

// Фильтр по роли
export class RoleMemberFilter implements IFilter<GroupMember> {
  constructor(
    private allowedRoles: Array<'creator' | 'admin' | 'member' | 'banned'>
  ) {}

  filter(members: GroupMember[]): GroupMember[] {
    return members.filter(member => this.allowedRoles.includes(member.role));
  }
}

// Фильтр по статусу участника
export class StatusMemberFilter implements IFilter<GroupMember> {
  constructor(
    private includeBots: boolean = true,
    private includePremium: boolean = true,
    private includeVerified: boolean = true,
    private includeDeleted: boolean = false,
    private includeContacts: boolean = true
  ) {}

  filter(members: GroupMember[]): GroupMember[] {
    return members.filter(member => {
      if (member.isBot && !this.includeBots) return false;
      if (member.isPremium && !this.includePremium) return false;
      if (member.isVerified && !this.includeVerified) return false;
      if (member.isDeleted && !this.includeDeleted) return false;
      if (member.isContact && !this.includeContacts) return false;

      return true;
    });
  }
}

// Фильтр по имени участника
export class NameMemberFilter implements IFilter<GroupMember> {
  constructor(
    private namePattern: string | RegExp,
    private searchInUsername: boolean = true
  ) {}

  filter(members: GroupMember[]): GroupMember[] {
    const pattern = typeof this.namePattern === 'string' 
      ? new RegExp(this.namePattern, 'i') 
      : this.namePattern;

    return members.filter(member => {
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
      
      if (pattern.test(fullName)) {
        return true;
      }

      if (this.searchInUsername && member.username && pattern.test(member.username)) {
        return true;
      }

      return false;
    });
  }
}

// Фильтр по дате присоединения
export class JoinDateMemberFilter implements IFilter<GroupMember> {
  constructor(
    private startDate?: Date,
    private endDate?: Date
  ) {}

  filter(members: GroupMember[]): GroupMember[] {
    return members.filter(member => {
      if (!member.joinDate) return !this.startDate && !this.endDate;

      const joinDate = new Date(member.joinDate);

      if (this.startDate && joinDate < this.startDate) {
        return false;
      }

      if (this.endDate && joinDate > this.endDate) {
        return false;
      }

      return true;
    });
  }
}

/**
 * Фабрика фильтров
 */
export class FilterFactory {
  // Фабричные методы для сообщений
  static createDateRangeMessageFilter(startDate: Date, endDate: Date): DateRangeMessageFilter {
    return new DateRangeMessageFilter(startDate, endDate);
  }

  static createKeywordMessageFilter(
    keywords: string[], 
    caseSensitive: boolean = false, 
    matchMode: 'any' | 'all' = 'any'
  ): KeywordMessageFilter {
    return new KeywordMessageFilter(keywords, caseSensitive, matchMode);
  }

  static createSenderMessageFilter(
    senderIds: number[] = [], 
    senderUsernames: string[] = [], 
    exclude: boolean = false
  ): SenderMessageFilter {
    return new SenderMessageFilter(senderIds, senderUsernames, exclude);
  }

  static createMessageTypeFilter(options: {
    includeForwarded?: boolean;
    includeWithMedia?: boolean;
    includeTextOnly?: boolean;
    minLength?: number;
    maxLength?: number;
  }): MessageTypeFilter {
    return new MessageTypeFilter(
      options.includeForwarded,
      options.includeWithMedia,
      options.includeTextOnly,
      options.minLength,
      options.maxLength
    );
  }

  // Фабричные методы для участников
  static createRoleMemberFilter(
    roles: Array<'creator' | 'admin' | 'member' | 'banned'>
  ): RoleMemberFilter {
    return new RoleMemberFilter(roles);
  }

  static createStatusMemberFilter(options: {
    includeBots?: boolean;
    includePremium?: boolean;
    includeVerified?: boolean;
    includeDeleted?: boolean;
    includeContacts?: boolean;
  }): StatusMemberFilter {
    return new StatusMemberFilter(
      options.includeBots,
      options.includePremium,
      options.includeVerified,
      options.includeDeleted,
      options.includeContacts
    );
  }

  // Создание составных фильтров
  static createMessageFilterChain(): CompositeFilter<Message> {
    return new CompositeFilter<Message>();
  }

  static createMemberFilterChain(): CompositeFilter<GroupMember> {
    return new CompositeFilter<GroupMember>();
  }
}

/**
 * Менеджер фильтров с предустановленными конфигурациями
 */
export class FilterManager {
  // Предустановленные фильтры для сообщений

  static getImportantMessagesFilter(): CompositeFilter<Message> {
    const filter = FilterFactory.createMessageFilterChain();
    
    // Сообщения с ключевыми словами важности
    filter.addFilter(FilterFactory.createKeywordMessageFilter([
      'важно', 'срочно', 'critical', 'urgent', '!!!', 'внимание'
    ], false, 'any'));
    
    // Исключаем пересланные сообщения
    filter.addFilter(FilterFactory.createMessageTypeFilter({
      includeForwarded: false
    }));
    
    return filter;
  }

  static getLongMessagesFilter(minLength: number = 500): CompositeFilter<Message> {
    const filter = FilterFactory.createMessageFilterChain();
    
    filter.addFilter(FilterFactory.createMessageTypeFilter({
      minLength: minLength,
      includeTextOnly: true
    }));
    
    return filter;
  }

  static getRecentMessagesFilter(days: number = 7): CompositeFilter<Message> {
    const filter = FilterFactory.createMessageFilterChain();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    filter.addFilter(FilterFactory.createDateRangeMessageFilter(startDate, new Date()));
    
    return filter;
  }

  // Предустановленные фильтры для участников

  static getAdminMembersFilter(): CompositeFilter<GroupMember> {
    const filter = FilterFactory.createMemberFilterChain();
    
    filter.addFilter(FilterFactory.createRoleMemberFilter(['creator', 'admin']));
    filter.addFilter(FilterFactory.createStatusMemberFilter({
      includeDeleted: false
    }));
    
    return filter;
  }

  static getActiveMembersFilter(): CompositeFilter<GroupMember> {
    const filter = FilterFactory.createMemberFilterChain();
    
    filter.addFilter(FilterFactory.createStatusMemberFilter({
      includeBots: false,
      includeDeleted: false
    }));
    
    return filter;
  }

  static getNewMembersFilter(days: number = 30): CompositeFilter<GroupMember> {
    const filter = FilterFactory.createMemberFilterChain();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    filter.addFilter(new JoinDateMemberFilter(startDate));
    
    return filter;
  }
}

/**
 * Примеры использования фильтров
 */
export function demonstrateFilters() {
  // Примеры сообщений
  const messages: Message[] = [
    {
      id: 1,
      date: new Date('2024-01-15').toISOString(),
      text: 'Важное сообщение о работе!',
      sender: { id: 123, firstName: 'Иван' },
      isForwarded: false
    },
    {
      id: 2,
      date: new Date('2024-01-16').toISOString(),
      text: 'Обычное сообщение',
      sender: { id: 124, firstName: 'Мария' },
      isForwarded: true
    },
    {
      id: 3,
      date: new Date('2024-01-17').toISOString(),
      text: 'Очень длинное сообщение с большим количеством текста. '.repeat(20),
      sender: { id: 125, firstName: 'Петр' }
    }
  ];

  // Примеры участников
  const members: GroupMember[] = [
    {
      id: 123,
      firstName: 'Иван',
      lastName: 'Петров',
      role: 'admin',
      isBot: false,
      joinDate: new Date('2024-01-01').toISOString()
    },
    {
      id: 124,
      firstName: 'Бот',
      lastName: 'Помощник',
      role: 'member',
      isBot: true,
      joinDate: new Date('2024-01-15').toISOString()
    }
  ];

  console.log('=== Демонстрация фильтров ===\n');

  // Фильтрация важных сообщений
  const importantFilter = FilterManager.getImportantMessagesFilter();
  const importantMessages = importantFilter.filter(messages);
  console.log(`Важные сообщения: ${importantMessages.length}/${messages.length}`);

  // Фильтрация длинных сообщений
  const longFilter = FilterManager.getLongMessagesFilter(100);
  const longMessages = longFilter.filter(messages);
  console.log(`Длинные сообщения: ${longMessages.length}/${messages.length}`);

  // Фильтрация администраторов
  const adminFilter = FilterManager.getAdminMembersFilter();
  const admins = adminFilter.filter(members);
  console.log(`Администраторы: ${admins.length}/${members.length}`);

  // Фильтрация активных участников
  const activeFilter = FilterManager.getActiveMembersFilter();
  const activeMembers = activeFilter.filter(members);
  console.log(`Активные участники: ${activeMembers.length}/${members.length}`);

  // Создание кастомного фильтра
  const customFilter = FilterFactory.createMessageFilterChain();
  customFilter.addFilter(FilterFactory.createKeywordMessageFilter(['работа']));
  customFilter.addFilter(FilterFactory.createMessageTypeFilter({
    includeForwarded: false,
    minLength: 10
  }));

  const customFiltered = customFilter.filter(messages);
  console.log(`Кастомный фильтр: ${customFiltered.length}/${messages.length}`);
}