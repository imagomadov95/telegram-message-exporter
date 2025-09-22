import { TelegramClient } from 'telegram';
import { DialogInfo, GroupMember, ExportFormat } from '../models/types';
import { IMemberService } from '../models/interfaces';
import { FileService } from '../utils/file-service';
export declare class MemberService implements IMemberService {
    private client;
    private fileService;
    constructor(client: TelegramClient, fileService: FileService);
    getGroupMembers(group: DialogInfo, limit?: number | null): Promise<GroupMember[]>;
    exportGroupMembers(group: DialogInfo, format?: ExportFormat, limit?: number | null): Promise<string | null>;
    getMemberById(group: DialogInfo, userId: number): Promise<GroupMember | null>;
    searchMembers(group: DialogInfo, query: string): Promise<GroupMember[]>;
    getAdminMembers(group: DialogInfo): Promise<GroupMember[]>;
    getBannedMembers(group: DialogInfo): Promise<GroupMember[]>;
    private mapParticipantToMember;
    private sanitizeFileName;
    displayMemberStats(members: GroupMember[]): void;
}
//# sourceMappingURL=member-service.d.ts.map