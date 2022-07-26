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

    //Approve our WETH ERC20 token
    console.log(`Approving WETH with a value of ${value}`);
    const isApproved = await approve(lendingPool.address, value, deployer);
    console.log(isApproved ? "Approved!" : "There was an issue trying to approve WETH token!");

    //Deposit
    console.log("Depositing...");
    const hasDeposit = await deposit(lendingPool, value, deployer);
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

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
