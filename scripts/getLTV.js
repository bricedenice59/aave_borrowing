const { network } = require("hardhat");
const { ethers } = require("ethers");
const { UiPoolDataProvider, ChainId } = require("@aave/contract-helpers");
const { formatReserves } = require("@aave/math-utils");
const { networkConfig } = require("../helper-hardhat-config");
const dayjs = require("dayjs");

const config = require("dotenv").config();
const dotenvExpand = require("dotenv-expand");
dotenvExpand.expand(config);

async function getLtv(tokenSymbol) {
    const uiPoolDataProviderAddress =
        networkConfig[network.config.chainId].uiPoolDataProviderAddress;
    const lendingPoolAddressProvider =
        networkConfig[network.config.chainId].lendingPoolAddressesProvider;

    const provider = new ethers.providers.StaticJsonRpcProvider(
        process.env.MAINNET_RPC_URL,
        ChainId.mainnet
    );

    // View contract used to fetch all reserves data (including market base currency data), and user reserves
    const poolDataProviderContract = new UiPoolDataProvider({
        uiPoolDataProviderAddress,
        provider,
        chainId: ChainId.mainnet,
    });

    // Object containing array of pool reserves and market base currency data
    // { reservesArray, baseCurrencyData }
    const reserves = await poolDataProviderContract.getReservesHumanized({
        lendingPoolAddressProvider,
    });

    const reservesArray = reserves.reservesData;
    const baseCurrencyData = reserves.baseCurrencyData;
    const currentTimestamp = dayjs().unix();

    const formattedPoolReserves = formatReserves({
        reserves: reservesArray,
        currentTimestamp,
        marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
        marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
    });

    filterDataByTokenSymbol = formattedPoolReserves.filter(function (obj) {
        return obj.symbol === tokenSymbol;
    });
    const ltv = filterDataByTokenSymbol[0].formattedBaseLTVasCollateral;
    if (parseFloat(ltv)) return Number(ltv);
    throw new Error(
        `Could not fetch property formattedBaseLTVasCollateral value for token ${tokenSymbol}`
    );
}

module.exports.extractLTVForCollateralToken = getLtv;
