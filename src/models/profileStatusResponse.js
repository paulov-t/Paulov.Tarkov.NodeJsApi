const { profileStatus } = require('./profileStatus');

class profileStatusResponse {
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

module.exports.profileStatusResponse = profileStatusResponse;