const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

const BASE_FEE = ethers.utils.parseEther("0.25"); //0.25 LINK for each request for mock
const GAS_PRICE_LINK = 1e9; //Chainlink Nodes pay the gas fees to give us randomness & do external exectuion, so the price of requests change based on the price of gas

module.exports = async function ({ getNamedAccounnts, deployments }) {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.name.chainId;
	const args = [BASE_FEE, GAS_PRICE_LINK];

	if (developmentChains.includes(network.name)) {
		log("local network detected! Deploying mocks");
		// deploy a mock vrfcoordinator
		await deploy("VRFCoordinatorV2Mock", {
			from: deployer,
			log: true,
			args: args,
		});
		log("Mock Deployed!");
		log("----------------------------------------");
	}
};

module.exports.tags = ["all", "mocks"];
