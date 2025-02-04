const { ClientMod } = require("../models/ClientMod");
const https = require('https');
const zlib = require('zlib');
require('dotenv').config()

class ClientModService {
    constructor() {
        
    }

    getClientMods() {

        // console.log(process.env);

        const arrayOfMods = [];
        if (process.env.MODS) {
            console.log(process.env.MODS);
            const envMods = JSON.parse(process.env.MODS);
            arrayOfMods.push(...envMods);
        }
        console.log(arrayOfMods);

        // const minimal = new ClientMod();
        // minimal.Name = "Paulov.Tarkov.Minimal";
        // minimal.GitHubUsername = "paulov-t"
        // minimal.GitHubRepo = "Paulov.Tarkov.Minimal"
        // minimal.GitHubUrl = "https://github.com/paulov-t/Paulov.Tarkov.Minimal"
        // arrayOfMods.push(minimal);

        let promises = [];
        for(const mod of arrayOfMods) 
            promises.push(this.getClientModDownloadLink(mod));

        return Promise.all(promises).then(v => { return arrayOfMods; });
    }

    /**
     * 
     * @param {ClientMod} clientMod 
     */
    getClientModDownloadLink(clientMod) {
        let promise = new Promise((resolve, reject) => {
            https.get( {
                headers: {
                    "user-agent": "PostmanRuntime/7.37.3",
                    "accept-encoding": "application/json"
                }
                , protocol: "https:"
                , hostname: "api.github.com"
                , path: `/repos/${clientMod.GitHubUsername}/${clientMod.GitHubRepo}/releases`
                }, (res) => {

                let bufData = '';
                res.on('data', 
                    /**
                     * 
                     * @param {Buffer} d 
                     */
                    (d) => {

                    if(d) {
                        bufData += d;
                    }
                    
                    
                    });

                res.on('end', (d) => {

                    if(d) {
                        bufData += d;
                    }
                try {
                        const jsonRelease = JSON.parse(bufData.toString('utf8'));
                        if(jsonRelease.length && jsonRelease.length > 0) {
                            if(jsonRelease[0].assets.length > 0) {

                                // console.log(jsonRelease[0].assets[0]);
                                const downloadLink = jsonRelease[0].assets[0].browser_download_url;
                                console.log(downloadLink);
                                clientMod.DownloadLink = downloadLink;
                                resolve();
                            }
                        }
                    }
                    catch (err) {
                console.error(err);
                reject();
                    }
                            });
                        }
                    
                    );
            });
        return promise;

    }
}

/**
 * Instantiate the ClientModService singleton
 */
module.exports.ClientModService = new ClientModService();

