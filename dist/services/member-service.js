"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberService = void 0;
class MemberService {
    constructor(client, fileService) {
        this.client = client;
        this.fileService = fileService;
    }
    async getGroupMembers(group, limit = null) {
        console.log(`\nGetting members from "${group.title}"...`);
        const members = [];
        let totalMembers = 0;
        try {
            for await (const participant of this.client.iterParticipants(group.entity, { limit: limit || undefined })) {
                const memberInfo = this.mapParticipantToMember(participant);
                members.push(memberInfo);
                totalMembers++;
                if (totalMembers % 100 === 0) {
                    console.log(`Got ${totalMembers} members...`);
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error getting group members:', errorMessage);
            if (errorMessage.includes('CHAT_ADMIN_REQUIRED')) {
                console.error('You need admin rights to get the full member list.');
            }
        }
        console.log(`\nFound ${totalMembers} members total.`);
        return members;
    }
    async exportGroupMembers(group, format = 'json', limit = null) {
        const members = await this.getGroupMembers(group, limit);
        if (members.length === 0) {
            console.log('No members found to export.');
            return null;
        }
        const membersExport = {
            groupInfo: {
                id: group.id,
                title: group.title,
                username: group.username || '',
                totalMembers: members.length,
                exportDate: new Date().toISOString()
            },
            members: members
        };
        const fileName = `${this.sanitizeFileName(group.title)}_members`;
        const filePath = await this.fileService.saveToFile(membersExport, fileName, format);
        console.log(`Group members exported to: ${filePath}`);
        return filePath;
    }
    async getMemberById(group, userId) {
        try {
            for await (const participant of this.client.iterParticipants(group.entity, { limit: 1000 })) {
                if (participant.id === userId) {
                    return this.mapParticipantToMember(participant);
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error getting member by ID:', error);
            return null;
        }
    }
    async searchMembers(group, query) {
        const allMembers = await this.getGroupMembers(group);
        const searchQuery = query.toLowerCase();
        return allMembers.filter(member => {
            const firstName = (member.firstName || '').toLowerCase();
            const lastName = (member.lastName || '').toLowerCase();
            const username = (member.username || '').toLowerCase();
            return firstName.includes(searchQuery) ||
                lastName.includes(searchQuery) ||
                username.includes(searchQuery);
        });
    }
    async getAdminMembers(group) {
        const allMembers = await this.getGroupMembers(group);
        return allMembers.filter(member => member.role === 'creator' || member.role === 'admin');
    }
    async getBannedMembers(group) {
        const allMembers = await this.getGroupMembers(group);
        return allMembers.filter(member => member.role === 'banned');
    }
    mapParticipantToMember(participant) {
        const memberInfo = {
            id: participant.id,
            firstName: participant.firstName || '',
            lastName: participant.lastName || '',
            username: participant.username || '',
            phone: participant.phone || '',
            isBot: participant.bot || false,
            isPremium: participant.premium || false,
            isVerified: participant.verified || false,
            isDeleted: participant.deleted || false,
            isSelf: participant.is_self || false,
            isContact: participant.contact || false,
            isMutualContact: participant.mutualContact || false,
            lastSeenStatus: participant.status ? participant.status.className : null,
            joinDate: null,
            role: 'member'
        };
        if (participant.participantType) {
            switch (participant.participantType.className) {
                case 'ChannelParticipantCreator':
                    memberInfo.role = 'creator';
                    break;
                case 'ChannelParticipantAdmin':
                    memberInfo.role = 'admin';
                    if (participant.participantType.promotedBy) {
                        memberInfo.promotedBy = participant.participantType.promotedBy;
                    }
                    if (participant.participantType.date) {
                        memberInfo.joinDate = new Date(participant.participantType.date * 1000).toISOString();
                    }
                    break;
                case 'ChannelParticipant':
                    memberInfo.role = 'member';
                    if (participant.participantType.date) {
                        memberInfo.joinDate = new Date(participant.participantType.date * 1000).toISOString();
                    }
                    break;
                case 'ChannelParticipantBanned':
                    memberInfo.role = 'banned';
                    memberInfo.bannedBy = participant.participantType.kickedBy;
                    if (participant.participantType.date) {
                        memberInfo.banDate = new Date(participant.participantType.date * 1000).toISOString();
                    }
                    break;
                default:
                    memberInfo.role = 'member';
            }
        }
        return memberInfo;
    }
    sanitizeFileName(fileName) {
        return fileName.replace(/[^\w\s]/gi, '_').replace(/\s+/g, '_');
    }
    displayMemberStats(members) {
        const stats = {
            total: members.length,
            creators: members.filter(m => m.role === 'creator').length,
            admins: members.filter(m => m.role === 'admin').length,
            members: members.filter(m => m.role === 'member').length,
            banned: members.filter(m => m.role === 'banned').length,
            bots: members.filter(m => m.isBot).length,
            premium: members.filter(m => m.isPremium).length,
            verified: members.filter(m => m.isVerified).length
        };
        console.log('\n=== Member Statistics ===');
        console.log(`Total Members: ${stats.total}`);
        console.log(`Creators: ${stats.creators}`);
        console.log(`Admins: ${stats.admins}`);
        console.log(`Regular Members: ${stats.members}`);
        console.log(`Banned: ${stats.banned}`);
        console.log(`Bots: ${stats.bots}`);
        console.log(`Premium Users: ${stats.premium}`);
        console.log(`Verified Users: ${stats.verified}`);
    }
}
exports.MemberService = MemberService;
//# sourceMappingURL=member-service.js.map