const { TraderService } = require("./TraderService");

class ActionCommandsService {
    constructor() {
    }

    createActionCommandOutput(account, accountProfile) {
        if (!account || !accountProfile) {
            return { success: false, error: "Invalid account or account profile" };
        }

        const result = {
            warnings: [],
            profileChanges: {
                
            }
        }
        result.profileChanges[account.accountId] = {
            _id: account.accountId,
            experience: accountProfile.characters.pmc.Info.Experience,
            quests: [],
            ragFairOffers: [],
            weaponBuilds: [],
            equipmentBuilds: [],
            items: { new: [], change: [], del: [] },
            production: {},
            improvements: JSON.parse(JSON.stringify(accountProfile.characters.pmc.Hideout.Improvements)),
            skills: { 
                Common: JSON.parse(JSON.stringify(accountProfile.characters.pmc.Skills.Common))
                , Mastering: JSON.parse(JSON.stringify(accountProfile.characters.pmc.Skills.Mastering))
                , Points: 0 
            },
            health: JSON.parse(JSON.stringify(accountProfile.characters.pmc.Health)),
            traderRelations: TraderService.updateTraderRelations(account),
            recipeUnlocked: {},
            questsStatus: []
        }
        return result;
    }
}

module.exports.ActionCommandsService = new ActionCommandsService();