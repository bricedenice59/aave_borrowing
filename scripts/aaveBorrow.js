const { getWeth } = require("./getWeth");
const { getNamedAccounts, ethers, network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");
const { extractLTVForCollateralToken } = require("./getLTV");

async function main() {
    var value = ethers.utils.parseEther("0.01");
    await getWeth(value);

    const { deployer } = await getNamedAccounts();

    //Lending pool
    const lendingPool = await getLendingPool(deployer);
    console.log(`LendingPool address: ${lendingPool.address}`);

    console.log("--------------deposit ETH----------------");
    await depositEthCollateral(value, lendingPool, deployer);
    console.log("-----------------------------------------");

    console.log("--------------borrow DAI----------------");
    await borrow(lendingPool, deployer);
    console.log("-----------------------------------------");
}

async function borrow(lendingPool, account) {
    const tokenSymbol = "DAI";
    const price = await getPrice(tokenSymbol);
    console.log(`${tokenSymbol}/ETH price ${price.toString()}`);

    const { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, account);
    const ltvPercentageForDai = await extractLTVForCollateralToken(tokenSymbol);
    const amountDaiToBorrow =
        availableBorrowsETH.toString() * ltvPercentageForDai * (1 / price.toNumber());
    console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`);
}

async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account);
    console.log(
        `total collateral worth ${ethers.utils.formatEther(totalCollateralETH)} ETH deposited`
    );
    console.log(`total debt worth ${ethers.utils.formatEther(totalDebtETH)} ETH`);
    console.log(
        `There is still ${ethers.utils.formatEther(availableBorrowsETH)} ETH available to borrow`
    );

    return { availableBorrowsETH, totalDebtETH };
}

async function depositEthCollateral(value, lendingPool, account) {
    //Approve our WETH ERC20 token
    console.log(`Approving WETH with a value of ${value}`);
    const isApproved = await approve(lendingPool.address, value, account);
    console.log(isApproved ? "Approved!" : "There was an issue trying to approve WETH token!");

    //Deposit
    console.log("Depositing collateral...");
    const hasDeposit = await deposit(lendingPool, value, account);
    console.log(
        hasDeposit
            ? "Deposited!"
            : "There was an issue trying to deposit WETH token to the lending pool!"
    );
}

async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        networkConfig[network.config.chainId].lendingPoolAddressesProvider,
        account
    );
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account);
    return lendingPool;
}

async function approve(spenderAddress, amountToSpend, account) {
    const iWeth = await ethers.getContractAt(
        "IWeth",
        networkConfig[network.config.chainId].wethToken,
        account
    );

    const tx = await iWeth.approve(spenderAddress, amountToSpend);
    const txReceipt = await tx.wait(1);
    return txReceipt.status == 1;
}

async function deposit(lendingPool, value, account) {
    const tx = await lendingPool.deposit(
        networkConfig[network.config.chainId].wethToken,
        value,
        account,
        0
    );
    const txReceipt = await tx.wait(1);
    return txReceipt.status == 1;
}

async function getPrice(tokenSymbol) {
    if (tokenSymbol != "DAI")
        throw new Error(`Cannot retrieve price for ${tokenSymbol} as no implementation exists`);
    const daiEthAddress = networkConfig[network.config.chainId].daiEthPriceFeedAddress;
    const aggregatorV3Interface = await ethers.getContractAt(
        "AggregatorV3Interface",
        daiEthAddress
    );
    return (await aggregatorV3Interface.latestRoundData())[1];
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
