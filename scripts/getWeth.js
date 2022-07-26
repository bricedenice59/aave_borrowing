const { getNamedAccounts, ethers } = require("hardhat");

//we expect amount to be a value in wei
async function getWeth(amount) {
    const { deployer } = await getNamedAccounts();
    console.log(deployer);
    const iWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    );
    const tx = await iWeth.deposit({ value: amount });
    await tx.wait(1);

    const wethBalance = await iWeth.balanceOf(deployer);
    console.log(`Successfully got ${wethBalance.toString()} WETH`);
}

module.exports = { getWeth };
