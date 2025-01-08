const { PlayerVisualRepresentation } = require("./PlayerVisualRepresentation");

class SquadPlayer {
    constructor() {
        this.aid = "";
        this._id = "";
        this.lookingGroup = false;
        this.IsLeader = false;
        this.IsReady = false;
        this.Info = {};
        this.PlayerVisualRepresentation = new PlayerVisualRepresentation();
    }
}

module.exports.SquadPlayer = SquadPlayer;