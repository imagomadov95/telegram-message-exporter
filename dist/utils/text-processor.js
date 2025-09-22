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
exports.TextProcessor = void 0;
const fs = __importStar(require("fs"));
class TextProcessor {
    extractTextFromJson(inputFile, outputFile) {
        try {
            console.log('Reading JSON file...');
            const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
            console.log(`Found ${jsonData.length} messages`);
            const textMessages = [];
            jsonData.forEach((message, index) => {
                if (message.text && message.text.trim()) {
                    textMessages.push({
                        number: index + 1,
                        id: message.id,
                        date: message.date,
                        text: message.text.trim()
                    });
                }
            });
            console.log(`Extracted ${textMessages.length} text messages`);
            fs.writeFileSync(outputFile, JSON.stringify(textMessages, null, 2), 'utf8');
            const textOnlyFile = outputFile.replace('.json', '.txt');
            const textContent = textMessages.map((msg, index) => `${index + 1}. [${msg.date}] ${msg.text}`).join('\n\n');
            fs.writeFileSync(textOnlyFile, textContent, 'utf8');
            console.log(`Saved to: ${outputFile}`);
            console.log(`Text-only saved to: ${textOnlyFile}`);
            return textMessages;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error:', errorMessage);
            throw new Error(`Failed to extract text from JSON: ${errorMessage}`);
        }
    }
    convertToMarkdown(inputFile, outputFile) {
        try {
            console.log('Reading text file...');
            const content = fs.readFileSync(inputFile, 'utf8');
            const lines = content.split('\n');
            let markdownContent = '# Экспортированные сообщения из Telegram\n\n';
            let currentMessage = '';
            let messageNumber = 0;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]?.trim();
                if (!line)
                    continue;
                const messageHeaderMatch = line.match(/^(\d+)\. \[([\d-T:.Z]+)\] (.+)$/);
                if (messageHeaderMatch) {
                    if (currentMessage) {
                        markdownContent += currentMessage + '\n\n---\n\n';
                    }
                    messageNumber = parseInt(messageHeaderMatch[1] || '0', 10);
                    const dateString = messageHeaderMatch[2] || '';
                    const text = messageHeaderMatch[3] || '';
                    let formattedDate;
                    try {
                        formattedDate = new Date(dateString).toLocaleString('ru-RU');
                    }
                    catch {
                        formattedDate = dateString;
                    }
                    currentMessage = `## Сообщение ${messageNumber}\n\n**Дата:** ${formattedDate}\n\n${text}`;
                }
                else if (line && currentMessage) {
                    currentMessage += '\n\n' + line;
                }
            }
            if (currentMessage) {
                markdownContent += currentMessage + '\n\n---\n\n';
            }
            markdownContent += `\n\n---\n\n*Всего сообщений: ${messageNumber}*\n`;
            markdownContent += `*Дата экспорта: ${new Date().toLocaleString('ru-RU')}*\n`;
            fs.writeFileSync(outputFile, markdownContent, 'utf8');
            console.log(`Markdown file saved to: ${outputFile}`);
            console.log(`Total messages converted: ${messageNumber}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error:', errorMessage);
            throw new Error(`Failed to convert to markdown: ${errorMessage}`);
        }
    }
}
exports.TextProcessor = TextProcessor;
//# sourceMappingURL=text-processor.js.map