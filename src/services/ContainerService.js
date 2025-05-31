class ContainerServiceSpotResult {
    /**
     * 
     * @param {Boolean} inSuccess 
     * @param {Number} inX 
     * @param {Number} inY 
     * @param {Boolean} inRotation 
     */
    constructor(inSuccess, inX, inY, inRotation) {
        this.success = inSuccess;
        this.x = inX;
        this.y = inY;
        this.rotation = inRotation;
    }
}

/**
 * A service to manage container array and placing items within a container array
 */
class ContainerService {
    /**
     * Finds a spot for an item in a container
     * @param container Array of container with slots filled/free
     * @param itemWidth Width of item
     * @param itemHeight Height of item
     * @returns Location to place item in container
     */
    findSpotForItem(container, itemWidth, itemHeight) {
        let rotation = false;
        const minVolume = (itemWidth < itemHeight ? itemWidth : itemHeight) - 1;
        const containerY = container.length;
        const containerX = container[0].length;
        const limitY = containerY - minVolume;
        const limitX = containerX - minVolume;

        // Every x+y slot taken up in container, exit
        if (container.every((x) => x.every((y) => y === 1))) {
            return new ContainerServiceSpotResult(false);
        }

        // Down
        for (let y = 0; y < limitY; y++) {
            // Across
            if (container[y].every((x) => x === 1)) {
                // Every item in row is full, skip row
                continue;
            }

            for (let x = 0; x < limitX; x++) {
                let foundspot = this.findSpot(container, containerX, containerY, x, y, itemWidth, itemHeight);

                // Failed to find slot, rotate item and try again
                if (!foundspot && itemWidth * itemHeight > 1) {
                    // Bigger than 1x1
                    foundspot = this.findSpot(container, containerX, containerY, x, y, itemHeight, itemWidth); // Height/Width swapped
                    if (foundspot) {
                        // Found a slot for it when rotated
                        rotation = true;
                    }
                }

                if (!foundspot) {
                    // Didn't fit this hole, try again
                    continue;
                }

                return new ContainerServiceSpotResult(true, x, y, rotation);
            }
        }

        // Tried all possible holes, nothing big enough for the item
        return new ContainerServiceSpotResult(false);
    }

    /**
     * Find a spot inside a container an item
     * @param {Number[][]} container Container to find space in
     * @param {Number} containerX Container x size
     * @param {Number} containerY Container y size
     * @param {Number} x ???
     * @param {Number} y ???
     * @param {Number} itemW Items width
     * @param {Number} itemH Items height
     * @returns True - slot found
     */
    findSpot(
        container,
        containerX,
        containerY,
        x,
        y,
        itemW,
        itemH,
    ) {
        let foundSlot = true;

        for (let itemY = 0; itemY < itemH; itemY++) {
            if (foundSlot && y + itemH - 1 > containerY - 1) {
                foundSlot = false;
                break;
            }

            for (let itemX = 0; itemX < itemW; itemX++) {
                if (foundSlot && x + itemW - 1 > containerX - 1) {
                    foundSlot = false;
                    break;
                }

                if (container[y + itemY][x + itemX] !== 0) {
                    foundSlot = false;
                    break;
                }
            }

            if (!foundSlot) {
                break;
            }
        }

        return foundSlot;
    }

    /**
     * Places the item in the given spot
     * @param {Number[][]} container Container to place item in
     * @param {Number} posX Container Position x
     * @param {Number} posY Container Position y
     * @param {Number} itemW Items width
     * @param {Number} itemH Items height
     * @param rotate is item rotated
     */
    addItemToContainerMap(
        container,
        posX,
        posY,
        itemW,
        itemH,
        rotate,
    ) {
        const itemWidth = rotate ? itemH : itemW;
        const itemHeight = rotate ? itemW : itemH;

        for (let y = posY; y < posY + itemHeight; y++) {
            for (let x = posX; x < posX + itemWidth; x++) {

                if (container[y] && container[y][x])
                    container[y][x] = 1;
            }
        }
        return container;
    }
}

module.exports.ContainerServiceSpotResult = ContainerServiceSpotResult;
module.exports.ContainerService = new ContainerService();
