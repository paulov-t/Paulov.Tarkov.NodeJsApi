const { ProfileStatus } = require('./ProfileStatus');

class ProfileStatusResponse {
    /**
     * 
     * @param {boolean} maxPveCountExceeded 
     * @param {profileStatus[]} profiles 
     */
    constructor(maxPveCountExceeded = false, profiles = []) {
        this.maxPveCountExceeded = maxPveCountExceeded;
        /**
         * 
         */
        this.profiles = profiles;
    }
}

module.exports.ProfileStatusResponse = ProfileStatusResponse;