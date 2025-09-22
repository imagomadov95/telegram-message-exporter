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
exports.DialogService = void 0;
const input = __importStar(require("input"));
class DialogService {
    constructor(client) {
        this.client = client;
    }
    async getDialogs() {
        const dialogs = await this.client.getDialogs();
        return dialogs.filter(dialog => dialog.isGroup || dialog.isChannel).map(dialog => this.mapDialogToInfo(dialog));
    }
    async selectGroup() {
        const groups = await this.getDialogs();
        console.log('\nAvailable groups and channels:');
        groups.forEach((group, index) => {
            const type = group.type === 'channel' ? 'Channel' : 'Group';
            const memberCount = group.participantsCount ? ` (${group.participantsCount} members)` : '';
            console.log(`${index + 1}. ${group.title} (${type})${memberCount}`);
        });
        const choice = await input.text('\nSelect group number: ');
        const selectedGroup = groups[parseInt(choice, 10) - 1];
        if (!selectedGroup) {
            throw new Error('Invalid selection');
        }
        return selectedGroup;
    }
    async getGroupByTitle(title) {
        const dialogs = await this.getDialogs();
        return dialogs.find(dialog => dialog.title.toLowerCase().includes(title.toLowerCase())) || null;
    }
    async getGroupById(id) {
        try {
            const entity = await this.client.getEntity(id);
            if ('title' in entity) {
                return this.mapEntityToDialogInfo(entity);
            }
            return null;
        }
        catch (error) {
            console.error('Error getting group by ID:', error);
            return null;
        }
    }
    async searchGroups(query) {
        const dialogs = await this.getDialogs();
        return dialogs.filter(dialog => dialog.title.toLowerCase().includes(query.toLowerCase()) ||
            (dialog.username && dialog.username.toLowerCase().includes(query.toLowerCase())));
    }
    mapDialogToInfo(dialog) {
        if (dialog.isGroup) {
            const groupInfo = {
                id: dialog.entity.id,
                title: dialog.title,
                username: dialog.entity.username || '',
                participantsCount: dialog.entity.participantsCount || 0,
                type: 'group',
                isCreator: dialog.entity.creator || false,
                hasGeo: dialog.entity.hasGeo || false,
                restrictionReason: dialog.entity.restrictionReason || null
            };
            return groupInfo;
        }
        else {
            const channelInfo = {
                id: dialog.entity.id,
                title: dialog.title,
                username: dialog.entity.username || '',
                participantsCount: dialog.entity.participantsCount || 0,
                type: 'channel',
                isBroadcast: dialog.entity.broadcast || false,
                isMegagroup: dialog.entity.megagroup || false,
                isVerified: dialog.entity.verified || false,
                restrictionReason: dialog.entity.restrictionReason || null
            };
            return channelInfo;
        }
    }
    mapEntityToDialogInfo(entity) {
        if (entity.className === 'Chat' || entity.className === 'ChatForbidden') {
            const groupInfo = {
                id: entity.id,
                title: entity.title,
                username: entity.username || '',
                participantsCount: entity.participantsCount || 0,
                type: 'group',
                isCreator: entity.creator || false,
                hasGeo: entity.hasGeo || false,
                restrictionReason: entity.restrictionReason || null
            };
            return groupInfo;
        }
        else {
            const channelInfo = {
                id: entity.id,
                title: entity.title,
                username: entity.username || '',
                participantsCount: entity.participantsCount || 0,
                type: 'channel',
                isBroadcast: entity.broadcast || false,
                isMegagroup: entity.megagroup || false,
                isVerified: entity.verified || false,
                restrictionReason: entity.restrictionReason || null
            };
            return channelInfo;
        }
    }
    displayGroupInfo(group) {
        console.log(`\n=== Group Information ===`);
        console.log(`Title: ${group.title}`);
        console.log(`Type: ${group.type}`);
        console.log(`ID: ${group.id}`);
        console.log(`Username: ${group.username || 'Not set'}`);
        console.log(`Members: ${group.participantsCount || 'Unknown'}`);
        if (group.type === 'channel') {
            const channel = group;
            console.log(`Broadcast: ${channel.isBroadcast ? 'Yes' : 'No'}`);
            console.log(`Megagroup: ${channel.isMegagroup ? 'Yes' : 'No'}`);
            console.log(`Verified: ${channel.isVerified ? 'Yes' : 'No'}`);
        }
        else {
            const groupEntity = group;
            console.log(`Creator: ${groupEntity.isCreator ? 'Yes' : 'No'}`);
            console.log(`Has Geo: ${groupEntity.hasGeo ? 'Yes' : 'No'}`);
        }
    }
}
exports.DialogService = DialogService;
//# sourceMappingURL=dialog-service.js.map