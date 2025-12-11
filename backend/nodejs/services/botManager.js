// backend/nodejs/services/botManager.js
const BotCreatorService = require('./botCreator');

class BotManager {
    constructor() {
        this.activeBots = new Map();
        this.botCreator = new BotCreatorService();
    }

    async initialize() {
        console.log('Bot Manager initialized');
    }

    async getUserBot(userId) {
        return this.botCreator.getUserBotStatus(userId);
    }

    async createBotForUser(userId, userData) {
        return await this.botCreator.createUserBot(userId, userData);
    }

    async stopUserBot(userId, botId) {
        return await this.botCreator.stopUserBot(userId, botId);
    }

    async updateBotConfig(userId, updates) {
        return await this.botCreator.updateBotConfiguration(userId, updates);
    }

    async getSystemStats() {
        return {
            totalActiveBots: this.activeBots.size,
            serviceStatus: 'running',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }
}

module.exports = BotManager;
