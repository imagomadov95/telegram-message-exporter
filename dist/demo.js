"use strict";
/**
 * Демо версия приложения для демонстрации архитектуры
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleTelegramExporter = void 0;
const simple_version_1 = require("./simple-version");
Object.defineProperty(exports, "SimpleTelegramExporter", { enumerable: true, get: function () { return simple_version_1.SimpleTelegramExporter; } });
const text_processor_1 = require("./utils/text-processor");
async function main() {
    const args = process.argv.slice(2);
    if (args.length >= 2 && args[0] === 'extract-text') {
        const textProcessor = new text_processor_1.TextProcessor();
        const inputFile = args[1];
        const outputFile = args[2] || 'extracted_text.json';
        console.log(`Input: ${inputFile}`);
        console.log(`Output: ${outputFile}`);
        try {
            textProcessor.extractTextFromJson(inputFile, outputFile);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to extract text:', errorMessage);
            process.exit(1);
        }
        return;
    }
    if (args.length >= 2 && args[0] === 'convert-markdown') {
        const textProcessor = new text_processor_1.TextProcessor();
        const inputFile = args[1];
        const outputFile = args[2] || 'messages.md';
        console.log(`Input: ${inputFile}`);
        console.log(`Output: ${outputFile}`);
        try {
            textProcessor.convertToMarkdown(inputFile, outputFile);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to convert to markdown:', errorMessage);
            process.exit(1);
        }
        return;
    }
    // Демо версия основного приложения
    const exporter = new simple_version_1.SimpleTelegramExporter();
    try {
        await exporter.run();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Application error:', errorMessage);
        process.exit(1);
    }
}
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
__exportStar(require("./models/types"), exports);
__exportStar(require("./models/interfaces"), exports);
__exportStar(require("./utils/config-manager"), exports);
__exportStar(require("./utils/file-service"), exports);
__exportStar(require("./utils/text-processor"), exports);
__exportStar(require("./utils/user-interface"), exports);
__exportStar(require("./simple-version"), exports);
//# sourceMappingURL=demo.js.map