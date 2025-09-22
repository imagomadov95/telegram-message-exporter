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
exports.AuthenticationService = void 0;
const input = __importStar(require("input"));
const telegram_1 = require("telegram");
class AuthenticationService {
    constructor(client, sessionManager) {
        this.client = client;
        this.sessionManager = sessionManager;
    }
    async authenticate(credentials) {
        console.log('\nConnecting to Telegram...');
        try {
            await this.client.connect();
            if (await this.client.checkAuthorization()) {
                console.log('Successfully connected using saved session!');
                return true;
            }
        }
        catch (error) {
            console.log('Saved session is invalid, need to re-authenticate...');
            this.sessionManager.clearSavedSession();
            this.sessionManager.createNewSession();
            this.client = new telegram_1.TelegramClient(this.sessionManager.getSession(), this.client.apiId, this.client.apiHash, { connectionRetries: 5 });
            this.sessionManager.setClient(this.client);
        }
        await this.client.start({
            phoneNumber: credentials?.phoneNumber
                ? async () => credentials.phoneNumber
                : async () => await input.text('Enter your phone number: '),
            password: credentials?.password
                ? async () => credentials.password
                : async () => await input.text('Enter your password (if required): '),
            phoneCode: credentials?.phoneCode
                ? async () => credentials.phoneCode
                : async () => await input.text('Enter the code you received: '),
            onError: (err) => console.log('Authentication error:', err.message),
        });
        console.log('Successfully authenticated!');
        this.sessionManager.saveSession();
        return true;
    }
    async checkAuthorization() {
        try {
            return await this.client.checkAuthorization();
        }
        catch (error) {
            return false;
        }
    }
    async getUserInfo() {
        try {
            if (await this.checkAuthorization()) {
                return await this.client.getMe();
            }
            throw new Error('Not authenticated');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to get user info: ${errorMessage}`);
        }
    }
    async reauthenticate() {
        try {
            this.sessionManager.clearSavedSession();
            this.sessionManager.createNewSession();
            this.client = new telegram_1.TelegramClient(this.sessionManager.getSession(), this.client.apiId, this.client.apiHash, { connectionRetries: 5 });
            this.sessionManager.setClient(this.client);
            return await this.authenticate();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Reauthentication failed:', errorMessage);
            return false;
        }
    }
    getClient() {
        return this.client;
    }
    async disconnect() {
        try {
            if (this.client) {
                await this.client.disconnect();
            }
        }
        catch (error) {
            console.error('Error disconnecting:', error);
        }
    }
}
exports.AuthenticationService = AuthenticationService;
//# sourceMappingURL=authentication-service.js.map