const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
	developmentChains,
	networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle", async function () {
			let raffle,
				vrfCoordinatorV2Mock,
				raffleEntranceFee,
				deployer,
				interval;
			const chainId = network.config.chainId;

			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer;
				await deployments.fixture(["all"]); //both our raffle and mocks has "all" tags
				raffle = await ethers.getContract("Raffle", deployer);
				vrfCoordinatorV2Mock = await ethers.getContract(
					"VRFCoordinatorV2Mock",
					deployer
				);
				raffleEntranceFee = await raffle.getEntranceFee();
				interval = await raffle.getInterval();
			});

			describe("constructor", async function () {
				it("initializes the raffle correctly", async function () {
					// ideally we make our tests have just 1 assert per "it"
					const raffleState = await raffle.getRaffleState();
					const interval = await raffle.getInterval();
					assert.equal(raffleState.toString(), "0");
					assert.equal(
						interval.toString(),
						networkConfig[chainId]["keepersUpdateInterval"]
					);
				});
			});

			describe("enterRaffle", async function () {
				it("reverts when you don't pay enough", async function () {
					await expect(raffle.enterRaffle()).to.be.revertedWith(
						"Raffle__NotEnoughEthEntered"
					);
				});

				it("records players when they enter", async function () {
					await raffle.enterRaffle({ value: raffleEntranceFee });
					const playerFromContract = await raffle.getPlayer(0);
					assert.equal(playerFromContract, deployer);
				});

				it("emits event on enter", async function () {
					await expect(
						raffle.enterRaffle({ value: raffleEntranceFee })
					).to.emit(raffle, "RaffleEnter");
				});

				it("doesn't allow entrance when raffle is calculating", async function () {
					//now to go on calculating state we need to perform the upkeep, but performUpkeep can only be called
					//if checkUpkeep returns true and for that to return true we have
					//our contract is open && sufficient time has passed && contract has atleast a player registered && contract has balance

					//now for above condition to satisfy we need to pass some time and at the same time some blocks need to be mined
					//for that hardhat comes built in with a lot of functions for the contract to do what we want it to do (Use hardhat network reference for this)
					// so we'll use evm_increaseTime && evm_mine for time and mining some block

					await raffle.enterRaffle({ value: raffleEntranceFee });
					await network.provider.send("evm_increaseTime", [
						interval.toNumber() + 1,
					]);
					await network.provider.send("evm_mine", []);

					//now all the mentioned conditions are satisfied, hence we can pretend to be Chainlink Keeper
					await raffle.performUpkeep([]); //[] denote empty call data
					await expect(
						raffle.enterRaffle({ value: raffleEntranceFee })
					).to.be.revertedWith("Raffle__NotOpen");
				});
			});
	  });
