import * as input from 'input';
import { IUserInterface } from '../models/interfaces';

export class UserInterface implements IUserInterface {
  
  async showMainMenu(): Promise<number> {
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

  async showSessionMenu(): Promise<number> {
    console.log('\n=== Session Management ===');
    console.log('1. View current session info');
    console.log('2. Clear saved session (force re-authentication)');
    console.log('3. Export current session string');
    console.log('4. Import session string');
    console.log('5. Back to main menu');
    
    const choice = await this.getInput('Select option (1-5): ');
    return parseInt(choice, 10);
  }

  async getInput(prompt: string): Promise<string> {
    try {
      return await input.text(prompt);
    } catch (error) {
      this.displayError('Error reading input');
      return '';
    }
  }

  displayInfo(message: string): void {
    console.log(message);
  }

  displayError(error: string): void {
    console.error(`❌ Error: ${error}`);
  }

  displaySuccess(message: string): void {
    console.log(`✅ ${message}`);
  }

  displayHeader(title: string): void {
    console.log(`\n=== ${title} ===`);
  }

  displaySeparator(): void {
    console.log('\n' + '='.repeat(50) + '\n');
  }

  async confirmAction(message: string): Promise<boolean> {
    const response = await this.getInput(`${message} (y/n): `);
    return response.toLowerCase() === 'y' || response.toLowerCase() === 'yes';
  }

  displayProgress(current: number, total: number, message: string): void {
    if (current % 100 === 0) {
      console.log(`${message}: ${current}/${total || '?'}`);
    }
  }

  displayFileList(files: string[], title: string = 'Available files'): void {
    console.log(`\n${title}:`);
    files.forEach((file, index) => {
      try {
        const fs = require('fs');
        const stats = fs.statSync(file);
        console.log(`${index + 1}. ${file} (${stats.mtime.toLocaleString()})`);
      } catch {
        console.log(`${index + 1}. ${file}`);
      }
    });
  }

  async selectFromList(items: string[], prompt: string): Promise<number> {
    const choice = await this.getInput(prompt);
    const index = parseInt(choice, 10) - 1;
    
    if (index < 0 || index >= items.length) {
      throw new Error('Invalid selection');
    }
    
    return index;
  }
}