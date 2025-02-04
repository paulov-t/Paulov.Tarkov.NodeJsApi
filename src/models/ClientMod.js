class ClientMod {
    constructor() {
        /**
         * Friendly name for the mod
         */
        this.Name = "";
        /**
         * GitHub Username for the repository
         */
        this.GitHubUsername = "";
        /**
         * GitHub Repo
         */
        this.GitHubRepo = "";
         /**
         * GitHub repository
         */
        this.GitHubUrl = "";
        /**
         * If DownloadLink is provided, this Client Mod will not attempt to find a release using GitHub Url
         */
        this.DownloadLink = undefined;
    }
}

module.exports.ClientMod = ClientMod;