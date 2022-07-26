const { getWeth } = require("./getWeth");
const { getNamedAccounts, ethers, network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");
const { extractLTVForCollateralToken } = require("./getLTV");

const tokenSymbol = "DAI";

async function main() {
    var value = ethers.utils.parseEther("10");
    await getWeth(value);

    const { deployer } = await getNamedAccounts();

    //Lending pool
    const lendingPool = await getLendingPool(deployer);
    console.log(`LendingPool address: ${lendingPool.address}`);

    console.log("--------------deposit ETH----------------");
    await depositEthCollateral(value, lendingPool, deployer);
    console.log("-----------------------------------------");

    console.log("--------------borrow DAI----------------");
    const amountDaiToBorrowWei = await borrow(lendingPool, deployer);
    console.log("-----------------------------------------");

    await getBorrowUserData(lendingPool, deployer);

    console.log("--------------repay----------------");
    await repay(
        amountDaiToBorrowWei,
        networkConfig[network.config.chainId].daiToken,
        lendingPool,
        deployer
    );
    console.log("-----------------------------------------");

    await getBorrowUserData(lendingPool, deployer);
}

async function borrow(lendingPool, account) {
    const price = await getPrice(tokenSymbol);
    console.log(`${tokenSymbol}/ETH price ${price.toString()}`);

    const { availableBorrowsETH } = await getBorrowUserData(lendingPool, account);
    const ltvPercentageForDai = await extractLTVForCollateralToken(tokenSymbol);
    const amountDaiToBorrow =
        availableBorrowsETH.toString() * ltvPercentageForDai * (1 / price.toNumber());
    const amountDaiToBorrowInWei = ethers.utils.parseEther(amountDaiToBorrow.toString());
    console.log(`You can borrow ${amountDaiToBorrow.toString()} ${tokenSymbol}`);

    const borrowTx = await lendingPool.borrow(
        networkConfig[network.config.chainId].daiToken,
        amountDaiToBorrowInWei,
        1,
        0,
        account
    );
    await borrowTx.wait(1);
    console.log("You've borrowed!");

    return amountDaiToBorrowInWei;
}

async function repay(amount, daiTokenAddress, lendingPool, account) {
    await approveErc20(daiTokenAddress, lendingPool.address, amount, account);

    const repayTx = await lendingPool.repay(daiTokenAddress, amount, 1, account);
    await repayTx.wait(1);
    console.log("Repaid!");
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
    const isApproved = await approveErc20(
        networkConfig[network.config.chainId].wethToken,
        lendingPool.address,
        value,
        account
    );
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

async function approveErc20(erc20Address, spenderAddress, amountToSpend, signer) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, signer);
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
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
    const latestRoundData = await aggregatorV3Interface.latestRoundData();
    return latestRoundData[1];
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
