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
exports.UserInterface = void 0;
const input = __importStar(require("input"));
class UserInterface {
    async showMainMenu() {
        console.log('\n=== Main Menu ===');
        console.log('1. Export messages from a group/channel');
        console.log('2. Export all contacts, groups, and channels');
        console.log('3. Export members from a group/channel');
        console.log('4. Monitor group messages in real-time');
        console.log('5. Update existing message file with new messages');
        console.log('6. Session management');
        console.log('7. Exit');
        const choice = await this.getInput('Select option (1-7): ');
        return parseInt(choice, 10);
    }
    async showSessionMenu() {
        console.log('\n=== Session Management ===');
        console.log('1. View current session info');
        console.log('2. Clear saved session (force re-authentication)');
        console.log('3. Export current session string');
        console.log('4. Import session string');
        console.log('5. Back to main menu');
        const choice = await this.getInput('Select option (1-5): ');
        return parseInt(choice, 10);
    }
    async getInput(prompt) {
        try {
            return await input.text(prompt);
        }
        catch (error) {
            this.displayError('Error reading input');
            return '';
        }
    }
    displayInfo(message) {
        console.log(message);
    }
    displayError(error) {
        console.error(`❌ Error: ${error}`);
    }
    displaySuccess(message) {
        console.log(`✅ ${message}`);
    }
    displayHeader(title) {
        console.log(`\n=== ${title} ===`);
    }
    displaySeparator() {
        console.log('\n' + '='.repeat(50) + '\n');
    }
    async confirmAction(message) {
        const response = await this.getInput(`${message} (y/n): `);
        return response.toLowerCase() === 'y' || response.toLowerCase() === 'yes';
    }
    displayProgress(current, total, message) {
        if (current % 100 === 0) {
            console.log(`${message}: ${current}/${total || '?'}`);
        }
    }
    displayFileList(files, title = 'Available files') {
        console.log(`\n${title}:`);
        files.forEach((file, index) => {
            try {
                const fs = require('fs');
                const stats = fs.statSync(file);
                console.log(`${index + 1}. ${file} (${stats.mtime.toLocaleString()})`);
            }
            catch {
                console.log(`${index + 1}. ${file}`);
            }
        });
    }
    async selectFromList(items, prompt) {
        const choice = await this.getInput(prompt);
        const index = parseInt(choice, 10) - 1;
        if (index < 0 || index >= items.length) {
            throw new Error('Invalid selection');
        }
        return index;
    }
}
exports.UserInterface = UserInterface;
//# sourceMappingURL=user-interface.js.map