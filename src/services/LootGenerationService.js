const LoggingService = require('./LoggingService');
const { Database } = require('./../classes/database');
const bsgHelper = require('./../bsgHelper');
const { DatabaseService } = require('./DatabaseService');
const { ContainerService } = require('./ContainerService');
const { InventoryService } = require('./InventoryService');

/**
 * A service to generate loot for the given map. Use the Generate method with location instance.
 * NOTE: Only instantiate this when needed. It can become a large memory instance.
 */
class LootGenerationService 
{
  constructor() {
    this.cachedItemPresets = {}
  }
  /**
   * DO NOT USE - Created via Loot generation
   */
    static LootRarities = {};
    /**
     * 
     */
    static LocationLootChanceModifierFromFile = 1.0;
    /**
     * 
     */
    static LootModifiers = {
        modifierSuperRare: 0.5,
        modifierRare: 0.6,
        modifierUnCommon: 0.85,
        modifierCommon: 0.95,
    };

    /**
     * DO NOT USE - Only for Loot generation
     */
    static PreviouslyGeneratedItems = [];

    /**
     * DO NOT USE - Only for Loot generation
     */
    static PreviouslyGeneratedContainers = [];

    /**
     * 
     * @returns {object} Loot Modifiers
     */
    static GetLootModifiers() 
    {
        if(LootGenerationService.LootModifiers.modifierSuperRare !== 0) {
            return LootGenerationService.LootModifiers;
        }
        
        modifierSuperRare *= (0.02 * LootGenerationService.LocationLootChanceModifierFromFile);
        modifierRare *= (0.05 * LootGenerationService.LocationLootChanceModifierFromFile);
        modifierUnCommon *= (0.15 * LootGenerationService.LocationLootChanceModifierFromFile);
        modifierCommon *= (0.5 * LootGenerationService.LocationLootChanceModifierFromFile);
        
        LootGenerationService.LootModifiers.modifierSuperRare = modifierSuperRare;
        LootGenerationService.LootModifiers.modifierRare = modifierRare;
        LootGenerationService.LootModifiers.modifierUnCommon = modifierUnCommon;
        LootGenerationService.LootModifiers.modifierCommon = modifierCommon;
        return LootGenerationService.LootModifiers;
    }

    /**
     * Calculates the Rarity of an item
     * @param {string} itemTemplate 
     * @returns {string} type of rarity this item falls into, i.e. Common -> Superrare
     */
    static GetItemRarityType(itemTemplate) {

      const database = Database;

      // let localeTempl = database.locales.global.en.templates[itemTemplate._id].Name;
      let localeTempl = undefined;//database.locales.global.en[`${itemTemplate._id} Name`].Name;
      if(!localeTempl || localeTempl == "undefined" || localeTempl == null || localeTempl === "")
        localeTempl = itemTemplate._props.Name;

        if(LootGenerationService.LootRarities[localeTempl] === undefined) {
      
          const backgroundColor = itemTemplate._props.BackgroundColor;
          const itemExperience = itemTemplate._props.LootExperience < 10 ? 10 : itemTemplate._props.LootExperience;
          const examineExperience = itemTemplate._props.ExamineExperience < 10 ? 10 : itemTemplate._props.ExamineExperience;
          const unlootable = itemTemplate._props.Unlootable;
      
          let itemRarityType = "COMMON";
      
          let item_price = Database.getTemplatePrice(itemTemplate._id);
          if(itemTemplate._props.ammoType !== undefined) {
            item_price = item_price * 310 * itemTemplate._props.StackMaxSize;
          }

          let itemCalculation = 
            ((itemExperience + examineExperience + (backgroundColor == "violet" || backgroundColor == "blue" ? 20 : 10)) * 1000)
              + (item_price * 0.01); 

          // if ammo_box
          if(itemTemplate._props.Name !== undefined && itemTemplate._props.Name.includes("ammo_box")) {
            itemCalculation *= 1.75;
          }
          // If weapon part / mod
          if(itemTemplate._props.ItemSound !== undefined && itemTemplate._props.ItemSound.includes("mod")) {
            itemCalculation *= 1.5;
          }
          if(backgroundColor === "blue") {
            itemCalculation *= 2.09;
          }
          
          itemCalculation = Math.round(itemCalculation / 10000);
          itemCalculation -= 2;

          itemCalculation = Math.min(10, itemCalculation);
          itemCalculation = Math.max(1, itemCalculation);
          // console.log(itemTemplate._props.Name);
          // console.log(itemCalculation);

          try {
            if(unlootable) {
              itemRarityType = "NOT_EXIST";
            }
            else {
              if (itemCalculation >= 9) {
                  itemRarityType = "SUPERRARE";
              } else if (itemCalculation >= 5) {
                  itemRarityType = "RARE";
              } else if (itemCalculation >= 3) {
                  itemRarityType = "UNCOMMON";
              }
            }
          } catch(err) {
            itemRarityType = "SUPERRARE";
          }
      
          LootGenerationService.LootRarities[localeTempl] = itemRarityType;
      
        }
      
      
        return LootGenerationService.LootRarities[localeTempl];
      }
      
      /**
       * Filters the Item Template by the Rarity system and returns whether to Accept or Decline
       * @param {*} itemTemplate 
       * @param {*} out_itemsRemoved 
       * @param {*} in_additionalLootModifier 
       * @returns {boolean} True = Include, False = Exclude
       */
      static FilterItemByRarity(
        itemTemplate, 
        out_itemsRemoved,
        in_additionalLootModifier
        ) {
          LootGenerationService.GetLootModifiers();

          const modifierSuperRare = LootGenerationService.LootModifiers.modifierSuperRare;
          const modifierRare = LootGenerationService.LootModifiers.modifierRare;
          const modifierUnCommon = LootGenerationService.LootModifiers.modifierUnCommon;
          const modifierCommon = LootGenerationService.LootModifiers.modifierCommon;
      
          if(in_additionalLootModifier === undefined)
            in_additionalLootModifier = 1.0;
            
          in_additionalLootModifier *= 2;
          in_additionalLootModifier *= LootGenerationService.LocationLootChanceModifierFromFile;
          in_additionalLootModifier *= 0.3;
          
          if(out_itemsRemoved == undefined)
            out_itemsRemoved = {};
      
          if(out_itemsRemoved.numberOfSuperrareRemoved === undefined) {
            out_itemsRemoved.numberOfSuperrareRemoved = 0;
          }
          if(out_itemsRemoved.numberOfRareRemoved === undefined) {
            out_itemsRemoved.numberOfRareRemoved = 0;
          }
          if(out_itemsRemoved.numberOfUncommonRemoved === undefined) {
            out_itemsRemoved.numberOfUncommonRemoved = 0;
          }
          if(out_itemsRemoved.numberOfCommonRemoved === undefined) {
            out_itemsRemoved.numberOfCommonRemoved = 0;
          }
      
          if(itemTemplate._props.QuestItem == true)
            return true;
      
          // If roubles (cash registers), always return true
          if(itemTemplate._id === "5449016a4bdc2d6f028b456f") 
            return true;
      
          const itemRarityType = LootGenerationService.GetItemRarityType(itemTemplate);
      
          // LoggingService.logInfo(itemRarityType + " - " + itemTemplate._props.Name);
      
            if (itemRarityType == "SUPERRARE") {
              if (Math.random() > (modifierSuperRare * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfSuperrareRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "RARE") {
              if (Math.random() > (modifierRare * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfRareRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "UNCOMMON") {
              if (Math.random() > (modifierUnCommon * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfUncommonRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "COMMON")  {
              const randomCommonNumber = Math.random();
              const randomCommonLootModifier = (modifierCommon * in_additionalLootModifier);
              if (randomCommonNumber > randomCommonLootModifier) {
                out_itemsRemoved.numberOfCommonRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else {
              return false;
            }
      }

      GenerateContainerLoot(containerData, loot, in_locationLootChanceModifier, in_mapName, templateItemList, containerLootAttempt) {

        // console.log(Database);
        // console.log(Database.getTemplateItems());

        const parentId = bsgHelper.generateMongoId();
        containerData.Root = parentId;
        containerData.Items[0]._id = parentId;
        const _items = containerData.Items;
        const containerTemplateId = _items[0]._tpl;

        /** String Tpl Id
         * {string}
         */
        // LootGenerationService.PreviouslyGeneratedContainers.push(containerId);

        const isWeaponBox = (containerTemplateId === "5909d5ef86f77467974efbd8");
        
        const isAirdrop = containerData.Id.includes("Scripts") || containerData.Id.includes("scripts");

        const containerTemplate = templateItemList[containerTemplateId];
        let container2D = Array(containerTemplate._props.Grids[0]._props.cellsV)
        .fill()
        .map(() => Array(containerTemplate._props.Grids[0]._props.cellsH).fill(0));

        let LootListItems = this.GenerateLootList(parentId, loot, templateItemList, containerLootAttempt);
        if (isAirdrop && LootListItems.length == 0) {
          LoggingService.logDebug(`Airdrop Container: ${parentId} ${containerTemplate._name}`);
          LootListItems = LootGenerationService.GenerateAirdropLootList(parentId, in_mapName, container2D);
        }

        if(LootListItems.length == 0 ) {
          LoggingService.logWarning(`EmptyContainer: ${parentId} ${containerTemplate._name}`);
          return false;
        }

        

            // const idPrefix = parentId.substring(0, parentId.length - 4);
            // let idSuffix = parseInt(parentId.substring(parentId.length - 4), 16) + 1;
          
            // const addedPresets = [];
          
            // // roll a maximum number of items  to spawn in the container between 0 and max slot count
            // // const minCount = Math.max(1, _RollMaxItemsToSpawn(ContainerTemplate));
            const minCount = 
            isWeaponBox ? LootListItems.length :
            Math.max(1, 
              Math.round(Math.random() * containerTemplate._props.Grids[0]._props.cellsV * containerTemplate._props.Grids[0]._props.cellsH));
  
              let usedLootItems = [];
          
              // we finished generating spawn for this container now its time to roll items to put in container
              let itemWidth = 0;
              let itemHeight = 0;
              let indexRolled = [];
              mainIterator: for (let i = 0; i < minCount && i < LootListItems.length; i++) {

                let containerItems = [];
          
                let RollIndex = this.RandomInteger(0, LootListItems.length - 1);
                // add current rolled index
                indexRolled.push(RollIndex);

                const rolledLootListItem = LootListItems[RollIndex];

                // getting rolled item
                const rolledRandomItemTemplateId = rolledLootListItem._tpl;
                if (usedLootItems.findIndex(x => x ===rolledRandomItemTemplateId) !== -1)
                  continue;

                const rolledRandomItemToPlace = templateItemList[rolledLootListItem._tpl];
                
                if (rolledRandomItemToPlace === undefined) {
                  LoggingService.logWarning(`Undefined in container: ${ContainerId}  ${LootListItems.length} ${RollIndex}`);
                  continue;
                }
                let result = { success: false };

                // Must be a preset or embedded into something else. Lets add the entire thing.
                if (rolledLootListItem.parentId != parentId) {
                  
                  // this is part of a preset.
                  const presetParent = LootListItems.find(x => x._id == rolledLootListItem.parentId);
                  if (_items.findIndex(x => x._tpl === presetParent._tpl) !== -1)
                    continue;

                  usedLootItems.push(presetParent._id)

                  const newPresetParentId = bsgHelper.generateMongoId();
                  containerItems.push({ _id: newPresetParentId, _tpl: presetParent._tpl, parentId: parentId });

                  const presetParentTemplate = templateItemList[presetParent._tpl];
                 
                  let extraWidth = 0;
                  let extraHeight = 0;
                  for(const presetModItem of LootListItems.filter(x => x.parentId == presetParent._id)) {
                    const presetModItemTemplate = templateItemList[presetModItem._tpl];
                    // if(presetModItemTemplate._props.ExtraSizeDown !== 0) {
                    //   console.log(presetModItemTemplate);
                    // }
                    extraWidth = Math.max(extraWidth, presetModItemTemplate._props.ExtraSizeLeft + presetModItemTemplate._props.ExtraSizeRight);
                    extraHeight = Math.max(extraHeight, presetModItemTemplate._props.ExtraSizeUp + presetModItemTemplate._props.ExtraSizeDown);
                    containerItems.push({ _id: presetModItem._id, _tpl: presetModItem._tpl, parentId: newPresetParentId, slotId: presetModItem.slotId });
                  }

                  itemWidth = presetParentTemplate._props.Width + extraWidth;
                  itemHeight = presetParentTemplate._props.Height + extraHeight;
                }
                else {
                  // get basic width and height of the item
                  itemWidth = rolledRandomItemToPlace._props.Width;
                  itemHeight = rolledRandomItemToPlace._props.Height;
                }

                if (itemWidth === 0 || itemHeight === 0)
                  continue;

                result = ContainerService.findSpotForItem(container2D, itemWidth, itemHeight);

                // finished attempting to insert item into container
                // if we weren't able to find an item to fit after x tries then container is probably full
                if (!result.success) 
                  break;
          
                container2D = ContainerService.addItemToContainerMap(container2D, result.x, result.y, itemWidth, itemHeight, result.rotation);
                let rot = result.rotation ? 1 : 0;

                if(containerItems.length > 0) {

                  containerItems[0].slotId = "main";
                  containerItems[0].location = { x: result.x, y: result.y, r: rot };
                  for(const item of containerItems) {
                    _items.push(item);
                  }

                  continue;
                }

                let containerItem = {
                  _id: bsgHelper.generateMongoId(),
                  _tpl: rolledRandomItemToPlace._id,
                  parentId: parentId,
                  slotId: "main",
                  location: { x: result.x, y: result.y, r: rot }
                };

                usedLootItems.push(rolledRandomItemToPlace._id)
          
            //     let cartridges;

                // Add amount to the Money or Ammo stack
                if (rolledRandomItemToPlace._parent === "543be5dd4bdc2deb348b4569" || rolledRandomItemToPlace._parent === "5485a8684bdc2da71d8b4567") {
                  let stackCount = this.RandomInteger(rolledRandomItemToPlace._props.StackMinRandom, rolledRandomItemToPlace._props.StackMaxRandom);
                  containerItem.upd = { StackObjectsCount: stackCount };
                } 
            // else if (rolledRandomItemToPlace._parent === "543be5cb4bdc2deb348b4568") {
            //       // Ammo container
            //       idSuffix++;
          
            //       cartridges = {
            //         // _id: idPrefix + idSuffix.toString(16),
            //         _id: bsgHelper.generateMongoId(),
            //         _tpl: rolledRandomItemToPlace._props.StackSlots[0]._props.filters[0].Filter[0],
            //         parentId: containerItem._id,
            //         slotId: "cartridges",
            //         upd: { StackObjectsCount: rolledRandomItemToPlace._props.StackMaxRandom },
            //       };
            //     } else if (rolledRandomItemToPlace._parent === "5448bc234bdc2d3c308b4569") {
            //       // Magazine
            //       idSuffix++;
            //       cartridges = {
            //         // _id: idPrefix + idSuffix.toString(16),
            //         _id: bsgHelper.generateMongoId(),
            //         _tpl: rolledRandomItemToPlace._props.Cartridges[0]._props.filters[0].Filter[0],
            //         parentId: parentId,
            //         slotId: "cartridges",
            //         upd: { StackObjectsCount: rolledRandomItemToPlace._props.Cartridges[0]._max_count },
            //       };
            //     }
          
                _items.push(containerItem);
          
            //     if (cartridges) _items.push(cartridges);
            //     idSuffix++;
            //   }
            
            // let changedIds = {};
            // for (const item of _items) {

            //   const localeTempl = DatabaseService.getDatabase().locales.global.en.templates[item._tpl];
            //   item.itemNameForDebug = localeTempl.Name
            //   // const itemTemplateForNaming = DatabaseService.getDatabase().items[item._tpl];
            //   // item.itemNameForDebug = itemTemplateForNaming._props.ShortName;
            //   const newId = bsgHelper.generateMongoId();
            //   // const newId = bsgHelper.generateMongoId();
            //   changedIds[item._id] = newId;
            //   item._id = newId;


          
            //   if (!item.parentId) continue;
            //   item.parentId = changedIds[item.parentId];
            }

            return true

      }

      RandomInteger(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

      /**
       * 
       * @param {String} containerId 
       * @returns {Array} an array of loot item ids
       */
      GenerateLootList(containerId, expectedItemDistribution, templateItemList, containerLootAttempt) {
        let lootList = [];
        let UniqueLootList = [];
        const itemCountDistList = expectedItemDistribution.itemcountDistribution;
        const itemCount = Math.max(1, itemCountDistList[this.RandomInteger(0, itemCountDistList.length-1)].count);
        const itemDistList = expectedItemDistribution.itemDistribution;

        let itemsRemoved = {};
        lootList = itemDistList.filter(x => 
          x !== undefined 
          && x.tpl !== undefined 
          && LootGenerationService.FilterItemByRarity(templateItemList[x.tpl], itemsRemoved, (x.relativeProbability * 0.1 + ((containerLootAttempt + 1) * 0.1))));
        if (lootList.length === 0) {
          LoggingService.logWarning(`lootList for ${containerId} ${templateItemList[containerId]} is empty`);
          return [];
        }

        let finalItemList = [];
        for(let index = 0; index < itemCount; index++)
        {
          const randomItem = lootList[this.RandomInteger(0, lootList.length-1)];
          if (!randomItem)
            continue;

          const templateItem = templateItemList[randomItem.tpl];

          let createdPreset = false;
          
          for (const itemPreset of Database.getItemPresetArrayByEncyclopedia(randomItem.tpl, ["_encyclopedia", "_items"])) {
            const presetItems = InventoryService.replaceIDs(itemPreset._items, undefined, undefined, undefined);
            if (presetItems) {
              presetItems[0].parentId = containerId;
              for(const pItem of presetItems) {
                finalItemList.push(pItem);
              }
              createdPreset = true;
            }
          }

          if (!createdPreset) {
            const newRandomItem = {
              _id: bsgHelper.generateMongoId(),
              _tpl: randomItem.tpl,
              parentId: containerId
            }
            finalItemList.push(newRandomItem);
          }
        }

        return finalItemList;
       
      }

      static GenerateAirdropLootList(containerId, in_location, container2D) {
        let itemsRemoved = {};
        const LootList = [];
        let UniqueLootList = [];

        return [];
        // get static container loot pools
        const ItemList = DatabaseService.getDatabase().locationConfigs.StaticLootTable[containerId];
        // get dynamic container loot pools for map
        const DynamicLootForMap = DatabaseService.getDatabase().locationConfigs.DynamicLootTable[in_location];
        if(DynamicLootForMap !== undefined) {
          const DynamicLootForMapKeys = Object.keys(DatabaseService.getDatabase().locationConfigs.DynamicLootTable[in_location]);
          if(DynamicLootForMapKeys !== undefined) {
            for(var i = 0; i < container2D.length-1 && LootList.length < container2D.length-1; i++) {
              const selectedLootIndex = utility.getRandomInt(0, DynamicLootForMapKeys.length);
              const selectedLootKey = DynamicLootForMapKeys[selectedLootIndex];
              if(selectedLootKey === undefined) 
                continue;

              const selectedLoot = DynamicLootForMap[selectedLootKey].SpawnList;
              if(selectedLoot === undefined) 
                continue;

              for (const item of selectedLoot) {
                const itemTemplate = DatabaseService.getDatabase().items[item];
                if (itemTemplate._props.LootExperience === undefined) {
                  LoggingService.logWarning(`itemTemplate._props.LootExperience == "undefined" for ${itemTemplate._id}`);
                  continue;
                }
                if(!LootGenerationService.FilterItemByRarity(itemTemplate, itemsRemoved, 5))
                  LootList.push(item);
              }
            }
          }
        }

        // Unique/Distinct the List
        UniqueLootList = [...new Set(LootList)];
        
        return UniqueLootList;
      }

      static GenerateWeaponBoxLootList(containerId, in_location, container2D) {

        const lootList = [];
        return [];

        // get static container loot pools
        const itemList = DatabaseService.getDatabase().locationConfigs.StaticLootTable[containerId].SpawnList
        const presetList = itemList.filter(x => ItemController.hasPreset(x));
        const selectedPresetId = presetList[utility.getRandomInt(0, presetList.length-1)];
        if(selectedPresetId) {
          const selectedPreset = ItemController.getStandardPreset(selectedPresetId);
          if(selectedPreset) {
            for(const presetItem of selectedPreset._items) {
              lootList.push(presetItem._tpl);
            }
          }
        }
       
        return [...new Set(lootList)];;
      }

      static GenerateWeaponLoot(ContainerId, _items) {
        // Check if static weapon.
        
        if (ContainerId != "5cdeb229d7f00c000e7ce174" && ContainerId != "5d52cc5ba4b9367408500062") {
          LoggingService.logWarning("GetLootContainerData is null something goes wrong please check if container template: " + _items[0]._tpl + " exists");
          return;
        } else {
          _items[0].upd = { FireMode: { FireMode: "fullauto" } };

          const GunTempalte = DatabaseService.getDatabase().items[_items[0]._tpl]; // template object
          const MagazineTemplate = DatabaseService.getDatabase().items[GunTempalte._props.Slots[0]._props.filters[0].Filter[0]]; // template object
          const Magazine_Size = MagazineTemplate._props.Cartridges[0]._max_count; // number
          const AmmoTemplates = MagazineTemplate._props.Cartridges[0]._props.filters[0].Filter; // array
          const magazine = {
            _id: utility.generateNewId("M"),
            _tpl: MagazineTemplate._id,
            parentId: _items[0]._id,
            slotId: "mod_magazine",
          };
          _items.push(magazine);
          for (let i = 0; i < Magazine_Size / 4; i++) {
            if (_items[0]._tpl == "5d52cc5ba4b9367408500062") {
              // this is grenade launcher ammo preset creation
              if (i == 0) {
                const bullet = {
                  _id: bsgHelper.generateMongoId(),
                  _tpl: AmmoTemplates[0],
                  parentId: magazine._id,
                  slotId: "cartridges",
                };
                _items.push(bullet);
                continue;
              }
              const bullet = {
                _id: bsgHelper.generateMongoId(),
                _tpl: AmmoTemplates[0],
                parentId: magazine._id,
                slotId: "cartridges",
                location: i,
              };
              _items.push(bullet);
            } else {
              // this is machine gun ammo preset creation
              const ammoCount = i % 2 == 0 ? 3 : 1;
              const bullet = {
                _id: bsgHelper.generateMongoId(),
                _tpl: AmmoTemplates[i % 2],
                parentId: magazine._id,
                slotId: "cartridges",
                location: i,
                upd: {
                  StackObjectsCount: ammoCount,
                },
              };
              _items.push(bullet);
            }
          }
          return;
        }
      }

      /**
       * Generates all "forced" (usually quest) items into containers
       * @param {*} forced 
       * @param {*} outputLoot 
       */
      static GenerateForcedLootInContainers(forced, outputLoot) {
        let count = 0;
        // ------------------------------------------------------
        // Handle any Forced Static Loot - i.e. Unknown Key
        // 
        LoggingService.logInfo(`Forced Loot Count: ${forced.length}`);
        let numberOfForcedStaticLootAdded = 0;
        for(let iForced in forced) {
          let thisForcedItem = utility.DeepCopy(forced[iForced]);
          let lootItem = forced[iForced];
          // console.log(lootItem);
          lootItem.IsForced = true;
          if(lootItem.IsStatic) {
            count++;
            const lootTableIndex = outputLoot.findIndex(x=>x.Id === thisForcedItem.Id);
            const lootTableAlreadyExists = lootTableIndex !== -1;
            let newParentId = "";
            if(!lootTableAlreadyExists) {
              newParentId = bsgHelper.generateMongoId();
              lootItem.Root = newId;
            }
            else {
              lootItem = outputLoot[lootTableIndex];
              newParentId = lootItem.Root;
            }
            let newForcedItemsList = [];

            for(let iDataItem in thisForcedItem.Items) {
              let newForcedInnerItem = {};
              if(iDataItem == 0 && !lootTableAlreadyExists)
              {
                newForcedInnerItem._tpl = thisForcedItem.Items[iDataItem];
                newForcedInnerItem._id = newId;
                lootItem.Items.push(newForcedInnerItem);
                continue;
              }
              let newInnerItemId = bsgHelper.generateMongoId();
              newForcedInnerItem._id = newInnerItemId;
              newForcedInnerItem._tpl = thisForcedItem.Items[iDataItem];
              const itemTemplateForNaming = DatabaseService.getDatabase().items[newForcedInnerItem._tpl];
              newForcedInnerItem.itemNameForDebug = itemTemplateForNaming._props.ShortName;
              newForcedInnerItem.parentId = newParentId;
              newForcedInnerItem.slotId = "main";
              newForcedInnerItem.location = {
                    x: lootTableAlreadyExists ? iDataItem : (iDataItem-1),
                    y: 0,
                    r: 0
                  }
              lootItem.Items[iDataItem > 0 ? iDataItem : (parseInt(iDataItem) + 1)] = newForcedInnerItem;
            }
            if(lootTableAlreadyExists)
              outputLoot[lootTableIndex] = lootItem;
            else
              outputLoot.push(lootItem);

            numberOfForcedStaticLootAdded++;
          }
        }
        if(numberOfForcedStaticLootAdded > 0) {
          LoggingService.logSuccess(`Added ${numberOfForcedStaticLootAdded} Forced Static Loot`);
        }
        return count;
      }

      /**
       * Generates all "forced" (usually quest) items into the world
       * @param {*} forced 
       * @param {*} output 
       * @returns {number} count of items placed, excluding statics
       */
      static GenerateForcedLootLoose(forced, output) {
          let count = 0;
          for (const i in forced) {
            const data = utility.DeepCopy(forced[i]);
            if(data.IsStatic)
              continue;
              const newItemsData = [];
            // forced loot should be only contain 1 item... (there shouldnt be any weapon in there...)
            const newId = utility.generateNewId(undefined, 3);
      
            const createEndLootData = {
              Id: data.Id,
              IsStatic: data.IsStatic,
              useGravity: data.useGravity,
              randomRotation: data.randomRotation,
              Position: data.Position,
              Rotation: data.Rotation,
              IsGroupPosition: data.IsGroupPosition,
              GroupPositions: data.GroupPositions,
              Root: newId,
              Items: [
                {
                  _id: newId,
                  _tpl: data.Items[0],
                },
              ],
            };
      
            output.Loot.push(createEndLootData);
            count++;
          }
          return count;
      }

      static GetRandomHideoutRequiredItem() {
        let randomItem = undefined;
        const dbItems = ItemController.getDatabaseItems();
        const dbItemKeys = Object.keys(dbItems);
        while(randomItem === undefined)
        {
          const dbHideoutAreas = DatabaseService.getDatabase().hideout.areas;
          const randomArea = dbHideoutAreas[utility.getRandomInt(0, dbHideoutAreas.length - 1)];
          const randomAreaStageKeys = Object.keys(randomArea.stages);
          const randomAreaStageKey = randomAreaStageKeys[utility.getRandomInt(0, randomAreaStageKeys.length - 1)];
          const randomAreaStage = randomArea.stages[randomAreaStageKey];
          if(randomAreaStage.requirements.length > 0) {
            const randomAreaStageTemplateItems = randomAreaStage.requirements
            .filter(x => x.templateId !== undefined && !ItemController.isMoney(x.templateId));
            const randomAreaStageTemplate = randomAreaStageTemplateItems[utility.getRandomInt(0, randomAreaStageTemplateItems.length - 1)];
            if(randomAreaStageTemplate)
              randomItem = dbItems[randomAreaStageTemplate.templateId];
          }
        } 
        return randomItem;
      }

      static async GenerateDynamicLootLooseAsync(typeArray, output, locationLootChanceModifier, MapName)
      {
        await new Promise(function(myResolve, myReject) {
          myResolve(GenerateDynamicLootLoose(typeArray, output, locationLootChanceModifier, MapName));
        });
      }

      /**
       * Generates the "Dynamic" loot found loose on the floor or shelves
       * @param {Array} typeArray 
       * @param {Array} output 
       * @param {number} locationLootChanceModifier 
       * @param {string} MapName 
       * @returns {number} count of generated items
       */
      static GenerateDynamicLootLoose(typeArray, output, locationLootChanceModifier, in_mapName)
      {
        let count = 0;
        const currentUsedPositions = [];
        const currentUsedItems = [];
        let filterByRarityOutput = {};

        const looseLootMultiplier = ConfigController.Configs["gameplay"].locationloot.DynamicLooseLootMultiplier;
        let dbLocationDynamicLoot = DatabaseService.getDatabase().locations[in_mapName].loot.dynamic;
        let dbLocationConfigs = DatabaseService.getDatabase().locationConfigs;
        let dbLocationConfigLoot = DatabaseService.getDatabase().locationConfigs.DynamicLootTable[in_mapName];

        // const dynamicLootTable = JSON.parse(fs.readFileSync(process.cwd() + `/db/locations/DynamicLootTable.json`));
        const mapDynamicLootTable = dbLocationConfigLoot;// dynamicLootTable[in_mapName];
        // for (let itemLoot in typeArray) {
          // const lootData = typeArray[itemLoot];
        mapLoot: for(const lootData of typeArray) {

          const randomItems = [];

          let spawnList = lootData.Items;
          if(spawnList.length === 0 || utility.getPercentRandomBool(10)) {
            const lootTable = mapDynamicLootTable[Object.keys(mapDynamicLootTable).find(x => lootData.Id.toLowerCase().includes(x))];
            if(lootTable) {
              spawnList = lootTable.SpawnList;
            }
          }
          spawnList = spawnList.filter(x => 
            this.FilterItemByRarity(DatabaseService.getDatabase().items[x], filterByRarityOutput, looseLootMultiplier)
          );

          // if empty spawn list and randomly not generate hideout item below
          if(spawnList.length === 0 && utility.getPercentRandomBool(40))
            continue;

          for (const id of spawnList) {
            const item = DatabaseService.getDatabase().items[id];
            randomItems.push(item);
          }
    
          const generatedItemId = bsgHelper.generateMongoId();
          let randomItem = randomItems[utility.getRandomInt(0, randomItems.length - 1)];
          if(randomItem === undefined) {
            randomItem = LootGenerationService.GetRandomHideoutRequiredItem();
          }

          const localeTempl = DatabaseService.getDatabase().locales.global.en.templates[randomItem._id];

          const createdItem = {
            _id: generatedItemId,
            _tpl: randomItem._id,
            DebugName: localeTempl
          };
    
          // item creation
          let createEndLootData = {
            Id: lootData.Id,
            IsStatic: lootData.IsStatic,
            useGravity: lootData.useGravity,
            randomRotation: lootData.randomRotation,
            Position: lootData.Position,
            Rotation: lootData.Rotation,
            IsGroupPosition: lootData.IsGroupPosition,
            GroupPositions: lootData.GroupPositions,
            Root: generatedItemId,
            Items: [createdItem],
          };

          if(ItemController.isAmmoBox(randomItem._id))
          {
            // this is not working, ignoring for now
            continue;
          }
          if(ItemController.isMoney(randomItem._id))
          {
            // this is not working, ignoring for now
            continue;
          }
          if(ItemController.isAmmo(randomItem._id))
          {
            // this is not working, ignoring for now
            continue;
          }
    
          let similarUsedPosition = currentUsedPositions.find(p => 
            mathjs.round(p.x, 3) == mathjs.round(lootData.Position.x, 3)
            && mathjs.round(p.y, 3) == mathjs.round(lootData.Position.y, 3)
            && mathjs.round(p.z, 3) == mathjs.round(lootData.Position.z, 3)
          );
          if(similarUsedPosition !== undefined
            ) {
    
            continue;
          }
    
            count++;
            output.Loot.push(createEndLootData);
            currentUsedPositions.push(createEndLootData.Position);
            currentUsedItems.push(createEndLootData);
       
        }
        
        return count;
      }


      /**
       * Generates the "Static" loot. Usually containers, airdrops, or weapons
       * @param {*} typeArray 
       * @param {*} output 
       * @param {*} locationLootChanceModifier 
       * @param {*} MapName 
       * @returns {Number} number of items generated
       */
      GenerateStaticLoot(typeArray, output, locationLootChanceModifier, MapName) {
        let count = 0;
        let dateStarted = Date.now();
        for (let i in typeArray) {
          let data = typeArray[i];
          dateStarted = Date.now();
    
          // Do not regenerate the same container twice
          if(LootGenerationService.PreviouslyGeneratedContainers.findIndex(x=>x.Id === data.Items[0]._tpl) !== -1)
            continue;
    
          if(this.GenerateContainerLoot(data, locationLootChanceModifier, MapName))
            count++;
    
          if (Date.now() - dateStarted > 50) LoggingService.logInfo(`Slow Container ${data.Id} [${Date.now() - dateStarted}ms]`);
          dateStarted = Date.now();
          data.Root = data.Items[0]._id;
          output.Loot.push(data);
          // count++;
        }
        return count;
      }


      Generate(location) {

        if(!location)
          throw "location parameter is undefined"


        const result = [];
        // Clear Loot Rarities
        LootGenerationService.LootRarities = {};
        LootGenerationService.PreviouslyGeneratedItems = [];
        LootGenerationService.PreviouslyGeneratedContainers = [];

        const templateItemList = DatabaseService.getDatabase().getTemplateItems();

        const locationLootChanceModifierFromFile = location.GlobalLootChanceModifier;
        const locationIdLower = location.Id.toLowerCase()

        const looseLoot = Database.getData(Database.locations[locationIdLower].looseLoot);

        for(const llspfItem of looseLoot.spawnpointsForced) {
          const locationId = llspfItem.locationId;
          const probability = llspfItem.probability;
          if (Math.random() < probability) {
            const template = llspfItem.template;
            if(template) {
              result.push(template);
            }
          }

        }

        const staticAmmo = Database.getData(Database.locations[locationIdLower].staticAmmo);
        const staticContainers = Database.getData(Database.locations[locationIdLower].staticContainers);
        const staticLoot = Database.getData(Database.locations[locationIdLower].staticLoot);
        const statics = Database.getData(Database.locations[locationIdLower].statics);

        for(const container of staticContainers.staticContainers) {
          if (!container.template)
            continue;

          if (!container.template.Items)
            continue;

          if (container.template.Items.length === 0)
            continue;

          if (Math.random() < container.probability) {
              const containerId = container.template.Items[0]._tpl;
              let containerLootResult = false;
              let containerLootAttempt = 0;
              while(!containerLootResult && containerLootAttempt < 10) {
                containerLootResult = this.GenerateContainerLoot(
                  container.template
                  , staticLoot[containerId]
                  , locationLootChanceModifierFromFile
                  , location.Name
                  , templateItemList
                  , containerLootAttempt
                );
                containerLootAttempt++;
              }
              result.push(container.template);
          }
        }

        return result;
      }
}

module.exports.LootGenerationService = LootGenerationService;
