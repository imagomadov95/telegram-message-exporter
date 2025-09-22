import { TelegramClient } from 'telegram';
import { DialogInfo } from '../models/types';
import { IDialogService } from '../models/interfaces';
export declare class DialogService implements IDialogService {
    private client;
    constructor(client: TelegramClient);
    getDialogs(): Promise<DialogInfo[]>;
    selectGroup(): Promise<DialogInfo>;
    getGroupByTitle(title: string): Promise<DialogInfo | null>;
    getGroupById(id: number): Promise<DialogInfo | null>;
    searchGroups(query: string): Promise<DialogInfo[]>;
    private mapDialogToInfo;
    private mapEntityToDialogInfo;
    displayGroupInfo(group: DialogInfo): void;
}
//# sourceMappingURL=dialog-service.d.ts.map