const { ethers } = require("hardhat");
const networkConfig = {
	5: {
		name: "goerli",
		subscriptionId: "4268",
		gasLane:
			"0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
		keepersUpdateInterval: "30",
		entranceFee: ethers.utils.parseEther("0.01"), // 0.1 ETH
		callbackGasLimit: "500000", // 500,000 gas
		vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
	},
	31337: {
		name: "hardhat",
		entranceFee: ethers.utils.parseEther("0.01"),
		gasLane:
			"0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // we can literally put anything in gasLane of mock as mock doesn't care
		keepersUpdateInterval: "30",
		callbackGasLimit: "500000",
	},
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
	networkConfig,
	developmentChains,
};
