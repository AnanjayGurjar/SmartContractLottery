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

			describe("constructor", function () {
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

			describe("enterRaffle", function () {
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

			describe("checkUpkeep", function () {
				it("returns false if people haven't sent any eth", async function () {
					await network.provider.send("evm_increaseTime", [
						interval.toNumber() + 1,
					]);
					await network.provider.send("evm_mine", []);
					//callstack is used to simulate how calling a particular transaction would react like
					const { upkeepNeeded } =
						await raffle.callStatic.checkUpkeep([]); //because raffle.checkUpkeep([]) will kickoff transaction as it is not a view function
					assert(!upkeepNeeded);
				});

				it("returns false if raffle isn't open", async function () {
					await raffle.enterRaffle({ value: raffleEntranceFee });
					await network.provider.send("evm_increaseTime", [
						interval.toNumber() + 1,
					]);
					await network.provider.send("evm_mine", []);
					await raffle.performUpkeep([]);
					const raffleState = await raffle.getRaffleState();
					const { upkeepNeeded } =
						await raffle.callStatic.checkUpkeep([]);
					assert.equal(raffleState.toString(), "1");
					assert.equal(upkeepNeeded, false);
				});

				it("returns false if enough time hasn't passed", async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee });
					await network.provider.send("evm_increaseTime", [
						interval.toNumber() - 5,
					]); // use a higher number here if this test fails
					await network.provider.request({
						method: "evm_mine",
						params: [],
					});
					const { upkeepNeeded } =
						await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
					assert(!upkeepNeeded);
				});

				it("returns true if enough time has passed, has players, eth, and is open", async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee });
					await network.provider.send("evm_increaseTime", [
						interval.toNumber() + 1,
					]);
					await network.provider.request({
						method: "evm_mine",
						params: [],
					});
					const { upkeepNeeded } =
						await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
					assert(upkeepNeeded);
				});
			});

			describe("performUpkeep", function () {
				it("it can only run if checkupkeep is true", async function () {
					await raffle.enterRaffle({ value: raffleEntranceFee });
					await network.provider.send("evm_increaseTime", [
						interval.toNumber() + 1,
					]);
					await network.provider.send("evm_mine", []);
					const tx = await raffle.performUpkeep([]);
					assert(tx);
				});

				it("reverts when checkupkeep is false", async function () {
					await expect(raffle.performUpkeep([])).to.be.revertedWith(
						"Raffle__UpkeepNotNeeded"
					);
				});

				it("updates the raffle state, emits the event and calls the vrf coordinator", async function () {
					await raffle.enterRaffle({ value: raffleEntranceFee });
					await network.provider.send("evm_increaseTime", [
						interval.toNumber() + 1,
					]);
					await network.provider.send("evm_mine", []);
					const txResponse = await raffle.performUpkeep([]);
					const rxReceipt = await txResponse.wait(1);
					const requestId = rxReceipt.events[1].args.requestId; //1 event as 0th event is emitted by the vrfCoordinator this also imply that manual event emitted by us in performUpkeep is redundant
					const raffleState = await raffle.getRaffleState();
					assert(requestId.toNumber() > 0);
					assert(raffleState.toString() == "1");
				});
			});
	  });
