var dev = {
    maxClients: 1000,
    maxNearbyCharacters: 50,
    maxIncomingMessageSize: 1e3,
    updateRateLimit: 300,
    maxCurrentUsersPerIP: 1000,
    maxLoginsPerHourPerIP: 1000,
    maxDailyLoginsPerAccount: 1000,
};
var prod = {
    maxClients: 100,
    maxNearbyCharacters: 25,
    maxIncomingMessageSize: 1e3,
    updateRateLimit: 5,
    maxCurrentUsersPerIP: 4,
    maxLoginsPerHourPerIP: 20,
    maxDailyLoginsPerAccount: 100,
};

var ConfigOptions;
if (process.argv.includes('dev')) {
    console.log('Starting in dev mode.');
    ConfigOptions = dev;
} else {
    console.log('Starting in prod mode.')
    ConfigOptions = prod;
}

export default ConfigOptions;