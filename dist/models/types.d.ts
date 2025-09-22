export interface TelegramConfig {
    apiId: number;
    apiHash: string;
}
export interface AppConfig {
    telegram: TelegramConfig;
}
export interface UserInfo {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
    isBot?: boolean;
    isPremium?: boolean;
    isVerified?: boolean;
    isDeleted?: boolean;
    isSelf?: boolean;
    isContact?: boolean;
    isMutualContact?: boolean;
    lastSeenStatus?: string | null;
}
export interface ContactInfo extends UserInfo {
}
export interface BotInfo extends UserInfo {
    isBot: true;
}
export interface GroupInfo {
    id: number;
    title: string;
    username?: string;
    participantsCount?: number;
    type: 'group';
    isCreator?: boolean;
    hasGeo?: boolean;
    restrictionReason?: string | null;
    entity?: any;
}
export interface ChannelInfo {
    id: number;
    title: string;
    username?: string;
    participantsCount?: number;
    type: 'channel';
    isBroadcast?: boolean;
    isMegagroup?: boolean;
    isVerified?: boolean;
    restrictionReason?: string | null;
    entity?: any;
}
export type DialogInfo = GroupInfo | ChannelInfo;
export interface ContactsExport {
    contacts: ContactInfo[];
    groups: GroupInfo[];
    channels: ChannelInfo[];
    bots: BotInfo[];
}
export interface MessageSender {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
}
export interface Message {
    id: number;
    date: string;
    sender?: MessageSender | null;
    text: string;
    isForwarded?: boolean;
    hasMedia?: boolean;
    mediaType?: string | null;
}
export interface GroupMember extends UserInfo {
    joinDate?: string | null;
    role: 'creator' | 'admin' | 'member' | 'banned';
    promotedBy?: number;
    bannedBy?: number;
    banDate?: string;
}
export interface GroupMembersExport {
    groupInfo: {
        id: number;
        title: string;
        username?: string;
        totalMembers: number;
        exportDate: string;
    };
    members: GroupMember[];
}
export type ExportFormat = 'json' | 'csv';
export interface ExtractedTextMessage {
    number: number;
    id: number;
    date: string;
    text: string;
}
export interface SessionInfo {
    filePath: string;
    exists: boolean;
    created?: Date;
    modified?: Date;
}
export interface AuthenticationCredentials {
    phoneNumber: string;
    password?: string;
    phoneCode: string;
}
export interface MonitoringOptions {
    checkInterval: number;
    isRunning: boolean;
}
export interface ExportOptions {
    limit?: number;
    format: ExportFormat;
    sinceDate?: Date;
}
//# sourceMappingURL=types.d.ts.map