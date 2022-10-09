const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { depoly, log } = deployments;
	const { deployer } = await getNamedAccounts();

	const raffle = await deployer("Raffle", {
		from: deployer,
		args: [],
		log: true,
		waitConfirmations: network.config.blockCofirmations || 1,
	});
};
