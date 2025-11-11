const { AccountService } = require('./../services/AccountService');
const { DatabaseService } = require('./../services/DatabaseService');
const { LocationService } = require('./../services/LocationService');
const { LootGenerationService } = require('./../services/LootGenerationService');

test('Generating Factory Loot', () => {
    const db = DatabaseService.getDatabase();
    expect(db);

    const locationRecord = new LocationService().getLocationByLocationName('factory4_day');
    expect(locationRecord);
    const generatedLocation = new LootGenerationService().Generate(locationRecord);
    expect(generatedLocation);


});

test('Get Looting Modifiers', () => {
    const modifiers = LootGenerationService.GetLootModifiers();
    expect(modifiers);
});