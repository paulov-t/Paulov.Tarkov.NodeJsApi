const { AccountProfileCharacter } = require('../models/account');
const { Inventory } = require('../models/Inventory');
const { PlayerVisualRepresentation, PlayerVisualRepresentationEquipment } = require('./../models/PlayerVisualRepresentation');

/**
 * A service to create a PlayerVisualRepresentation instance object
 */
class PlayerVisualRepresentationService {
    constructor() {

    }

    /**
     * Create's a {PlayerVisualRepresentation} from a {AccountProfileCharacter} instance
     * @param {AccountProfileCharacter} character 
     * @returns {PlayerVisualRepresentation} 
     */
    createPlayerVisualRepresentation(character) {
        const pvr = new PlayerVisualRepresentation();
        pvr.Customization = character.Customization;
        pvr.Info = character.Info;
        pvr.Equipment = this.createPlayerVisualRepresentationEquipmentFromInventory(character.Inventory);
        return pvr;
    }

    /**
     * Create's a {PlayerVisualRepresentationEquipment} from an {Inventory} instance
     * @param {Inventory} inventory 
     * @returns {PlayerVisualRepresentationEquipment}
     */
    createPlayerVisualRepresentationEquipmentFromInventory(inventory) {
        const pvre = new PlayerVisualRepresentationEquipment();

        pvre.Id = inventory.equipment;
        pvre.Items = inventory.items;

        return pvre;

    }
}

module.exports.PlayerVisualRepresentationService = PlayerVisualRepresentationService;
