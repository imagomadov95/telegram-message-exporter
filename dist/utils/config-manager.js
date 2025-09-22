"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const fs = __importStar(require("fs"));
class ConfigManager {
    loadConfig() {
        try {
            if (!fs.existsSync(ConfigManager.CONFIG_FILE)) {
                throw new Error(`Configuration file ${ConfigManager.CONFIG_FILE} not found`);
            }
            const configData = fs.readFileSync(ConfigManager.CONFIG_FILE, 'utf8');
            const config = JSON.parse(configData);
            if (!this.validateConfig(config)) {
                throw new Error('Invalid configuration format');
            }
            return config;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error loading config: ${error.message}`);
            }
            throw new Error('Unknown error loading config');
        }
    }
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }
        if (!config.telegram || typeof config.telegram !== 'object') {
            return false;
        }
        const telegram = config.telegram;
        if (!telegram.apiId || typeof telegram.apiId !== 'number' || telegram.apiId <= 0) {
            return false;
        }
        if (!telegram.apiHash || typeof telegram.apiHash !== 'string' || telegram.apiHash.length === 0) {
            return false;
        }
        return true;
    }
    static createExampleConfig() {
        const exampleConfig = {
            telegram: {
                apiId: 0,
                apiHash: "your_api_hash_here"
            }
        };
        fs.writeFileSync('config.example.json', JSON.stringify(exampleConfig, null, 2));
    }
}
exports.ConfigManager = ConfigManager;
ConfigManager.CONFIG_FILE = 'config.json';
//# sourceMappingURL=config-manager.js.map