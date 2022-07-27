const { getNamedAccounts, ethers, network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

//we expect amount to be a value in wei
async function getWeth(amount) {
    const { deployer } = await getNamedAccounts();
    console.log(deployer);
    const iWeth = await ethers.getContractAt(
        "IWeth",
        networkConfig[network.config.chainId].wethToken,
        deployer
    );
    const tx = await iWeth.deposit({ value: amount });
    await tx.wait(1);

    const wethBalance = await iWeth.balanceOf(deployer);
    console.log(`Successfully got ${wethBalance.toString()} WETH`);
}

module.exports = { getWeth };
