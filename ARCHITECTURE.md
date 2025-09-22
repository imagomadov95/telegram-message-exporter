# Архитектура приложения Telegram Message Exporter

## 🏗 Обзор архитектуры

Приложение построено на принципах **SOLID** и использует **слоистую архитектуру** для обеспечения масштабируемости, тестируемости и сопровождаемости кода.

## 📊 Диаграмма слоев

```
┌─────────────────────────────────────┐
│            Controllers              │
│         (telegram-exporter)         │
├─────────────────────────────────────┤
│              Services               │
│   Authentication │ Message │ etc.   │
├─────────────────────────────────────┤
│               Utils                 │
│  Config │ FileService │ UI │ etc.   │
├─────────────────────────────────────┤
│              Models                 │
│        Types │ Interfaces           │
├─────────────────────────────────────┤
│          External APIs              │
│         Telegram │ File System      │
└─────────────────────────────────────┘
```

## 🧩 Компоненты системы

### 1. Models Layer (Модели)

**Назначение**: Определение типов данных и интерфейсов

**Файлы**:
- `types.ts` - Все типы данных приложения
- `interfaces.ts` - Интерфейсы сервисов и компонентов

**Принципы**:
- Строгая типизация
- Immutable объекты где возможно
- Четкое разделение типов по доменам

### 2. Utils Layer (Утилиты)

**Назначение**: Вспомогательные функции без бизнес-логики

**Компоненты**:

#### ConfigManager
- **Ответственность**: Загрузка и валидация конфигурации
- **Принцип**: Single Responsibility
- **Интерфейс**: `IConfigManager`

#### FileService  
- **Ответственность**: Работа с файлами и экспорт данных
- **Принцип**: Open/Closed - легко расширяется новыми форматами
- **Интерфейс**: `IFileService`

#### TextProcessor
- **Ответственность**: Обработка и преобразование текста
- **Принцип**: Single Responsibility
- **Интерфейс**: `ITextProcessor`

#### UserInterface
- **Ответственность**: Взаимодействие с пользователем
- **Принцип**: Dependency Inversion - зависит от абстракций
- **Интерфейс**: `IUserInterface`

### 3. Services Layer (Сервисы)

**Назначение**: Бизнес-логика приложения

#### SessionManager
```typescript
class SessionManager implements ISessionManager {
  // Управление сессиями Telegram
  // Принципы: SRP, закрытость для модификации
}
```

#### AuthenticationService  
```typescript
class AuthenticationService implements IAuthenticationService {
  // Аутентификация в Telegram
  // Зависимости: SessionManager
}
```

#### ContactService
```typescript
class ContactService implements IContactService {
  // Работа с контактами
  // Зависимости: TelegramClient, FileService
}
```

#### DialogService
```typescript
class DialogService implements IDialogService {
  // Работа с диалогами (группы/каналы)
  // Принцип: Interface Segregation
}
```

#### MessageService
```typescript
class MessageService implements IMessageService {
  // Экспорт и мониторинг сообщений
  // Сложная бизнес-логика с множественными зависимостями
}
```

#### MemberService
```typescript
class MemberService implements IMemberService {
  // Работа с участниками групп
  // Зависимости: TelegramClient, FileService
}
```

### 4. Controllers Layer (Контроллеры)

#### TelegramMessageExporter
```typescript
class TelegramMessageExporter implements ITelegramExporter {
  // Главный контроллер приложения
  // Координирует работу всех сервисов
  // Принцип: Dependency Injection
}
```

**Ответственности**:
- Инициализация всех сервисов
- Координация между слоями
- Обработка пользовательского ввода
- Управление жизненным циклом приложения

## 🎯 Применение принципов SOLID

### Single Responsibility Principle (SRP)
Каждый класс имеет одну причину для изменения:
- `ConfigManager` - только управление конфигурацией
- `FileService` - только файловые операции
- `AuthenticationService` - только аутентификация

### Open/Closed Principle (OCP)
Классы открыты для расширения, закрыты для модификации:
```typescript
// Легко добавить новый формат экспорта
class FileService {
  private convertToCSV(data: any): string { /* ... */ }
  private convertToXML(data: any): string { /* NEW */ }
}
```

### Liskov Substitution Principle (LSP)
Любая реализация интерфейса может заменить другую:
```typescript
// Можно легко заменить реализацию
let ui: IUserInterface = new ConsoleUI();
ui = new WebUI(); // Подстановка без нарушения работы
```

### Interface Segregation Principle (ISP)
Интерфейсы разделены по функциональности:
```typescript
// Вместо одного большого интерфейса
interface IMessageService { /* только сообщения */ }
interface IMemberService { /* только участники */ }
interface IContactService { /* только контакты */ }
```

### Dependency Inversion Principle (DIP)
Зависимости от абстракций, не от конкретных классов:
```typescript
class TelegramExporter {
  constructor(
    private messageService: IMessageService, // абстракция
    private contactService: IContactService  // абстракция
  ) {}
}
```

## 🔄 Потоки данных

### 1. Инициализация приложения
```
User Input → TelegramExporter → ConfigManager → SessionManager → AuthenticationService
```

### 2. Экспорт сообщений
```
User Selection → DialogService → MessageService → FileService → File Output
```

### 3. Мониторинг сообщений
```
Timer → MessageService → TelegramClient → MessageService → UserInterface
```

## 🧪 Тестируемость

### Dependency Injection
Все зависимости инжектируются через конструкторы:
```typescript
class MessageService {
  constructor(
    private client: TelegramClient,    // можно замокать
    private fileService: FileService  // можно замокать
  ) {}
}
```

### Интерфейсы для моков
```typescript
// В тестах можно использовать моки
const mockFileService: IFileService = {
  saveToFile: jest.fn(),
  findMessageFiles: jest.fn(),
  createBackup: jest.fn()
};
```

## 🔌 Расширяемость

### Добавление нового формата экспорта

1. **Расширить enum**:
```typescript
export type ExportFormat = 'json' | 'csv' | 'xml'; // добавили xml
```

2. **Расширить FileService**:
```typescript
private convertToXML(data: any): string {
  // Новая логика конвертации
}
```

3. **Обновить switch statement**:
```typescript
switch (format.toLowerCase()) {
  case 'xml':
    content = this.convertToXML(data);
    break;
}
```

### Добавление нового сервиса

1. **Создать интерфейс**:
```typescript
export interface IAnalyticsService {
  generateReport(data: Message[]): AnalyticsReport;
}
```

2. **Реализовать сервис**:
```typescript
export class AnalyticsService implements IAnalyticsService {
  generateReport(data: Message[]): AnalyticsReport {
    // Логика аналитики
  }
}
```

3. **Добавить в контроллер**:
```typescript
class TelegramExporter {
  private analyticsService: IAnalyticsService;
  
  constructor() {
    this.analyticsService = new AnalyticsService();
  }
}
```

## 🛡 Обработка ошибок

### Стратегия обработки ошибок по слоям

#### Utils Layer
```typescript
// Выбрасывают конкретные ошибки
throw new Error(`Configuration file ${file} not found`);
```

#### Services Layer  
```typescript
// Ловят, логируют и перебрасывают
try {
  // операция
} catch (error) {
  console.error('Service error:', error);
  throw new ServiceError('Failed to process request', error);
}
```

#### Controllers Layer
```typescript
// Финальная обработка для пользователя
try {
  await this.service.doSomething();
} catch (error) {
  this.ui.displayError(error.message);
}
```

## 📈 Производительность

### Асинхронная архитектура
- Все операции I/O асинхронные
- Использование `async/await` вместо callbacks
- Параллельная обработка где возможно

### Ленивая загрузка
```typescript
// Участники загружаются по мере необходимости
for await (const participant of this.client.iterParticipants()) {
  // Обработка по одному
}
```

### Batch обработка
```typescript
// Сообщения в группах по 100
if (totalMessages % 100 === 0) {
  console.log(`Processed ${totalMessages} messages...`);
}
```

## 🔄 Жизненный цикл приложения

```
1. Initialization
   ├── Config Loading
   ├── Session Management  
   └── Service Setup

2. Authentication
   ├── Session Validation
   ├── User Authentication
   └── Session Saving

3. Main Loop
   ├── Menu Display
   ├── User Input Processing
   ├── Service Execution
   └── Result Display

4. Cleanup
   ├── Session Saving
   ├── Connection Closing
   └── Resource Cleanup
```

## 🎨 Паттерны проектирования

### Strategy Pattern
```typescript
// Разные стратегии экспорта
interface ExportStrategy {
  export(data: any): string;
}

class JSONExportStrategy implements ExportStrategy { }
class CSVExportStrategy implements ExportStrategy { }
```

### Factory Pattern
```typescript
// Фабрика сервисов
class ServiceFactory {
  static createMessageService(client: TelegramClient): IMessageService {
    return new MessageService(client, new FileService());
  }
}
```

### Observer Pattern
```typescript
// Мониторинг сообщений
class MessageMonitor {
  private observers: MessageObserver[] = [];
  
  addObserver(observer: MessageObserver): void { }
  notifyObservers(message: Message): void { }
}
```

Эта архитектура обеспечивает:
- ✅ **Масштабируемость** - легко добавлять новые функции
- ✅ **Тестируемость** - каждый компонент можно тестировать изолированно  
- ✅ **Сопровождаемость** - изменения локализованы в соответствующих слоях
- ✅ **Переиспользование** - компоненты можно использовать в других проектах
- ✅ **Типобезопасность** - TypeScript обеспечивает проверку типов на этапе компиляции