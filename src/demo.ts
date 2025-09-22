/**
 * Демо версия приложения для демонстрации архитектуры
 */

import { SimpleTelegramExporter } from './simple-version';
import { TextProcessor } from './utils/text-processor';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length >= 2 && args[0] === 'extract-text') {
    const textProcessor = new TextProcessor();
    const inputFile = args[1]!;
    const outputFile = args[2] || 'extracted_text.json';
    
    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    
    try {
      textProcessor.extractTextFromJson(inputFile, outputFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to extract text:', errorMessage);
      process.exit(1);
    }
    return;
  }
  
  if (args.length >= 2 && args[0] === 'convert-markdown') {
    const textProcessor = new TextProcessor();
    const inputFile = args[1]!;
    const outputFile = args[2] || 'messages.md';
    
    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    
    try {
      textProcessor.convertToMarkdown(inputFile, outputFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to convert to markdown:', errorMessage);
      process.exit(1);
    }
    return;
  }
  
  // Демо версия основного приложения
  const exporter = new SimpleTelegramExporter();
  try {
    await exporter.run();
  } catch (error) {
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

export { SimpleTelegramExporter };
export * from './models/types';
export * from './models/interfaces';
export * from './utils/config-manager';
export * from './utils/file-service';
export * from './utils/text-processor';
export * from './utils/user-interface';
export * from './simple-version';