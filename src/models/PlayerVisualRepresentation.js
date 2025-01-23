class PlayerVisualRepresentation {
    constructor() {
        this.Info = {};
        this.Customization = {};
        /**
         * @type {PlayerVisualRepresentationEquipment}
         */
        this.Equipment = new PlayerVisualRepresentationEquipment();
    }
}

class PlayerVisualRepresentationEquipment {
    constructor() {
        /**
         * @type {String}
         */
        this.Id = "";
        /**
         * @type {Array}
         */
        this.Items = [];
    }
}

module.exports.PlayerVisualRepresentation = PlayerVisualRepresentation;
module.exports.PlayerVisualRepresentationEquipment = PlayerVisualRepresentationEquipment;