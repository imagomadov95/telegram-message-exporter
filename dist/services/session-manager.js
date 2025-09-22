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
exports.SessionManager = void 0;
const fs = __importStar(require("fs"));
const sessions_1 = require("telegram/sessions");
class SessionManager {
    constructor(client) {
        this.sessionFile = 'telegram_session.txt';
        this.client = null;
        this.session = new sessions_1.StringSession('');
        this.client = client || null;
    }
    setClient(client) {
        this.client = client;
    }
    getSession() {
        return this.session;
    }
    loadSavedSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const sessionString = fs.readFileSync(this.sessionFile, 'utf8').trim();
                if (sessionString) {
                    console.log('Found saved session, attempting to use it...');
                    this.session = new sessions_1.StringSession(sessionString);
                    return true;
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log('Error loading saved session:', errorMessage);
        }
        return false;
    }
    saveSession() {
        try {
            if (this.client?.session) {
                const sessionString = this.client.session.save();
                fs.writeFileSync(this.sessionFile, sessionString, 'utf8');
                console.log(`Session saved to ${this.sessionFile}`);
                return true;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error saving session:', errorMessage);
        }
        return false;
    }
    clearSavedSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                fs.unlinkSync(this.sessionFile);
                console.log('Saved session cleared.');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error clearing session:', errorMessage);
        }
    }
    getSessionInfo() {
        const sessionInfo = {
            filePath: this.sessionFile,
            exists: fs.existsSync(this.sessionFile)
        };
        if (sessionInfo.exists) {
            try {
                const stats = fs.statSync(this.sessionFile);
                sessionInfo.created = stats.birthtime;
                sessionInfo.modified = stats.mtime;
            }
            catch (error) {
                console.error('Error getting session file stats:', error);
            }
        }
        return sessionInfo;
    }
    exportSessionString() {
        try {
            if (this.client?.session) {
                return this.client.session.save();
            }
            return null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error exporting session:', errorMessage);
            return null;
        }
    }
    importSessionString(sessionString) {
        try {
            if (sessionString?.trim()) {
                fs.writeFileSync(this.sessionFile, sessionString.trim(), 'utf8');
                return true;
            }
            return false;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error importing session:', errorMessage);
            return false;
        }
    }
    createNewSession() {
        this.session = new sessions_1.StringSession('');
        return this.session;
    }
    async displaySessionInfo() {
        console.log('\n=== Session Information ===');
        const sessionInfo = this.getSessionInfo();
        if (sessionInfo.exists) {
            console.log(`Session file: ${sessionInfo.filePath}`);
            if (sessionInfo.created) {
                console.log(`Created: ${sessionInfo.created.toLocaleString()}`);
            }
            if (sessionInfo.modified) {
                console.log(`Last modified: ${sessionInfo.modified.toLocaleString()}`);
            }
            console.log('Status: Session file exists');
        }
        else {
            console.log('Status: No saved session found');
        }
        if (this.client && await this.client.checkAuthorization()) {
            try {
                const me = await this.client.getMe();
                console.log(`\nConnected as:`);
                console.log(`Name: ${me.firstName || ''} ${me.lastName || ''}`);
                console.log(`Username: @${me.username || 'not set'}`);
                console.log(`Phone: ${me.phone || 'not available'}`);
                console.log(`ID: ${me.id}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.log('Could not get user info:', errorMessage);
            }
        }
        else {
            console.log('\nStatus: Not currently authenticated');
        }
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session-manager.js.map