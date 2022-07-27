const config = require("dotenv").config();
const dotenvExpand = require("dotenv-expand");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");

dotenvExpand.expand(config);

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL;
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL;
const REPORT_GAS = process.env.REPORT_GAS;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.0",
            },
            {
                version: "0.6.6",
            },
            {
                version: "0.6.12",
            },
            {
                version: "0.4.18",
            },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 2,
            forking: {
                url: MAINNET_RPC_URL,
            },
        },
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6,
        },
    },
    gasReporter: {
        enabled: REPORT_GAS,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    mocha: {
        timeout: 600000,
    },
};
