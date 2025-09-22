import { IUserInterface } from '../models/interfaces';
export declare class UserInterface implements IUserInterface {
    showMainMenu(): Promise<number>;
    showSessionMenu(): Promise<number>;
    getInput(prompt: string): Promise<string>;
    displayInfo(message: string): void;
    displayError(error: string): void;
    displaySuccess(message: string): void;
    displayHeader(title: string): void;
    displaySeparator(): void;
    confirmAction(message: string): Promise<boolean>;
    displayProgress(current: number, total: number, message: string): void;
    displayFileList(files: string[], title?: string): void;
    selectFromList(items: string[], prompt: string): Promise<number>;
}
//# sourceMappingURL=user-interface.d.ts.map