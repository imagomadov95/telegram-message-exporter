import * as fs from 'fs';
import { ExtractedTextMessage } from '../models/types';
import { ITextProcessor } from '../models/interfaces';

export class TextProcessor implements ITextProcessor {
  
  extractTextFromJson(inputFile: string, outputFile: string): ExtractedTextMessage[] {
    try {
      console.log('Reading JSON file...');
      const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
      
      console.log(`Found ${jsonData.length} messages`);
      
      const textMessages: ExtractedTextMessage[] = [];
      
      jsonData.forEach((message: any, index: number) => {
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
      const textContent = textMessages.map((msg, index) => 
        `${index + 1}. [${msg.date}] ${msg.text}`
      ).join('\n\n');
      
      fs.writeFileSync(textOnlyFile, textContent, 'utf8');
      
      console.log(`Saved to: ${outputFile}`);
      console.log(`Text-only saved to: ${textOnlyFile}`);
      
      return textMessages;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error:', errorMessage);
      throw new Error(`Failed to extract text from JSON: ${errorMessage}`);
    }
  }

  convertToMarkdown(inputFile: string, outputFile: string): void {
    try {
      console.log('Reading text file...');
      const content = fs.readFileSync(inputFile, 'utf8');
      
      const lines = content.split('\n');
      let markdownContent = '# Экспортированные сообщения из Telegram\n\n';
      
      let currentMessage = '';
      let messageNumber = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        
        if (!line) continue;
        
        const messageHeaderMatch = line.match(/^(\d+)\. \[([\d-T:.Z]+)\] (.+)$/);
        
        if (messageHeaderMatch) {
          if (currentMessage) {
            markdownContent += currentMessage + '\n\n---\n\n';
          }
          
          messageNumber = parseInt(messageHeaderMatch[1] || '0', 10);
          const dateString = messageHeaderMatch[2] || '';
          const text = messageHeaderMatch[3] || '';
          
          let formattedDate: string;
          try {
            formattedDate = new Date(dateString).toLocaleString('ru-RU');
          } catch {
            formattedDate = dateString;
          }
          
          currentMessage = `## Сообщение ${messageNumber}\n\n**Дата:** ${formattedDate}\n\n${text}`;
        } else if (line && currentMessage) {
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
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error:', errorMessage);
      throw new Error(`Failed to convert to markdown: ${errorMessage}`);
    }
  }
}