const networkConfig = {
    31337: {
        name: "localhost",
        wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", //weth on mainnet
        daiToken: "0x6b175474e89094c44da98b954eedeac495271d0f", //dai on mainnet
        lendingPoolAddressesProvider: "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", //aave lending pool address provider on mainnet
        uiPoolDataProviderAddress: "0x548e95Ce38B8cb1D91FD82A9F094F26295840277", //aave ui pool provider address on mainnet
        daiEthPriceFeedAddress: "0x773616E4d11A78F511299002da57A0a94577F1f4",
    },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains,
};
