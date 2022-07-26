const { getWeth } = require("./getWeth");
const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    var value = ethers.utils.parseEther("0.01");
    await getWeth(value);

    const { deployer } = await getNamedAccounts();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
