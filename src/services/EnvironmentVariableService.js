class EnvironmentVariableService {
    constructor() {
    }

    /**
     * 
     * @returns {Object} - Environment variables
     * @description This function retrieves all environment variables and returns them as an object.
     */
    getEnvironmentVariables() {
        const envVars = {
            LABS_REQUIRES_KEYCARD: process.env.LABS_REQUIRES_KEYCARD || true,
            BOTS_ENABLED: process.env.BOTS_ENABLED || true,
            BOTS_DIFFICULTY: process.env.BOTS_DIFFICULTY || 'normal',
        };

        return envVars;
    }
}

module.exports.EnvironmentVariableService = new EnvironmentVariableService();