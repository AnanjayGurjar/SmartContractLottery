require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL;
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const GOERLI_API_KEY = process.env.GOERLI_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 31337,
            blockConfirmations: 1,
		},
		rinkeby: {
			chainId: 4,
            blockConfirmations: 6,
			url: RINKEBY_RPC_URL,
			accounts: [RINKEBY_PRIVATE_KEY],
		},
		goerli: {
			chainId: 5,
			url: GOERLI_RPC_URL,
            blockConfirmations: 6,
			accounts: [PRIVATE_KEY],
			saveDeployments: true,
		},
	},
	gasReporter: {
		enabled: false,
		currency: "USD",
		outputFile: "gas-report.txt",
		noColors: true,
		// coinmarketcap: process.env.COINMARKETCAP_API_KEY,
	},
	solidity: "0.8.7",
	namedAccounts: {
		deployer: {
			default: 0,
		},
		player: {
			default: 1,
		},
	},
	mocha: {
		timeout: 300000, //300 sec
	},
	etherscan: {
		apiKey: {
			goerli: ETHERSCAN_API_KEY,
		},
	},
};
