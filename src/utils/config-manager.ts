import * as fs from 'fs';
import { AppConfig, TelegramConfig } from '../models/types';
import { IConfigManager } from '../models/interfaces';

export class ConfigManager implements IConfigManager {
  private static readonly CONFIG_FILE = 'config.json';

  loadConfig(): AppConfig {
    try {
      if (!fs.existsSync(ConfigManager.CONFIG_FILE)) {
        throw new Error(`Configuration file ${ConfigManager.CONFIG_FILE} not found`);
      }

      const configData = fs.readFileSync(ConfigManager.CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData) as AppConfig;
      
      if (!this.validateConfig(config)) {
        throw new Error('Invalid configuration format');
      }

      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error loading config: ${error.message}`);
      }
      throw new Error('Unknown error loading config');
    }
  }

  validateConfig(config: AppConfig): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    if (!config.telegram || typeof config.telegram !== 'object') {
      return false;
    }

    const telegram: TelegramConfig = config.telegram;
    
    if (!telegram.apiId || typeof telegram.apiId !== 'number' || telegram.apiId <= 0) {
      return false;
    }

    if (!telegram.apiHash || typeof telegram.apiHash !== 'string' || telegram.apiHash.length === 0) {
      return false;
    }

    return true;
  }

  static createExampleConfig(): void {
    const exampleConfig: AppConfig = {
      telegram: {
        apiId: 0,
        apiHash: "your_api_hash_here"
      }
    };

    fs.writeFileSync('config.example.json', JSON.stringify(exampleConfig, null, 2));
  }
}