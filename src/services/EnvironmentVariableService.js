class EnvironmentVariableService {
    constructor() {
    }

    /**
     * 
     * @returns {EnvironmentVariableModel} - Environment variables
     * @description This function retrieves all environment variables and returns them as an object.
     */
    getEnvironmentVariables() {
        const envVars = {
            LABS_REQUIRES_KEYCARD: process.env.LABS_REQUIRES_KEYCARD || true,
            BOTS_ENABLED: process.env.BOTS_ENABLED || true,
            BOTS_DIFFICULTY: process.env.BOTS_DIFFICULTY || 'normal',
            ZOMBIES_ONLY: process.env.ZOMBIES_ONLY || false,

            LOOT_MODIFIER_SUPERRARE: process.env.LOOT_MODIFIER_SUPERRARE || 0.5,
            LOOT_MODIFIER_RARE: process.env.LOOT_MODIFIER_RARE || 0.6,
            LOOT_MODIFIER_UNCOMMON: process.env.LOOT_MODIFIER_UNCOMMON || 0.85,
            LOOT_MODIFIER_COMMON: process.env.LOOT_MODIFIER_COMMON || 0.9,

            HARDCORE_MODE: process.env.HARDCORE_MODE || false,
            HARDCORE_MODE_LOOT_MODIFIER: process.env.HARDCORE_MODE_LOOT_MODIFIER || 0.5,

            SHOW_HALLOWEEN_TRADERS: process.env.SHOW_HALLOWEEN_TRADERS || true,

        };

        let envVarsModel = new EnvironmentVariableModel();
        for (const key in envVars) {
            if (envVars.hasOwnProperty(key)) {
                if (envVarsModel.hasOwnProperty(key)) {
                    envVarsModel[key] = envVars[key];
                }
            }
        }
        return envVarsModel;
    }
}

class EnvironmentVariableModel {
    constructor() {
        this.LABS_REQUIRES_KEYCARD = true;
        this.BOTS_ENABLED = true;
        this.BOTS_DIFFICULTY = 'normal';

        this.ZOMBIES_ONLY = false;
        this.SHOW_HALLOWEEN_TRADERS = true;

        this.LOOT_MODIFIER_SUPERRARE = 0.5;
        this.LOOT_MODIFIER_RARE = 0.6;
        this.LOOT_MODIFIER_UNCOMMON = 0.85;
        this.LOOT_MODIFIER_COMMON = 0.9;

        this.HARDCORE_MODE = false;
        this.HARDCORE_MODE_LOOT_MODIFIER = 0.5;
    }
}

module.exports.EnvironmentVariableService = new EnvironmentVariableService();
module.exports.EnvironmentVariableModel = EnvironmentVariableModel;