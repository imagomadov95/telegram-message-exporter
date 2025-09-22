import { AppConfig } from '../models/types';
import { IConfigManager } from '../models/interfaces';
export declare class ConfigManager implements IConfigManager {
    private static readonly CONFIG_FILE;
    loadConfig(): AppConfig;
    validateConfig(config: AppConfig): boolean;
    static createExampleConfig(): void;
}
//# sourceMappingURL=config-manager.d.ts.map