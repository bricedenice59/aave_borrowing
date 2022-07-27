const { getWeth } = require("./getWeth");
const { getNamedAccounts, ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

async function main() {
    var value = ethers.utils.parseEther("0.01");
    await getWeth(value);

    const { deployer } = await getNamedAccounts();

    //Lending pool
    const lendingPool = await getLendingPool(deployer);
    console.log(`LendingPool address: ${lendingPool.address}`);

    await depositEthCollateral(value, lendingPool, deployer);
    await borrow(lendingPool, deployer);
}

async function borrow(lendingPool, account) {
    const daiPrice = await getPrice("DAI");
    console.log(`DAI/ETH price ${daiPrice.toString()}`);

    const { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, account);
    // 0.77 is the Loan To Value percentage for DAI
    //https://docs.aave.com/risk/v/aave-v2/asset-risk/risk-parameters#loan-to-value
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.77 * (1 / daiPrice.toNumber());
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString());
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
