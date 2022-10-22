const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect, assert } = require("chai");
const { network, getNamedAccounts, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle Staging tests", function () {
			let raffle, raffleEntranceFee, deployer;

			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer;
				raffle = await ethers.getContract("Raffle", deployer);
				raffleEntranceFee = await raffle.getEntranceFee();
			});

			describe("fulfillRandomWords", function () {
				it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
					//enter the raffle
					const startingTimeStamp = await raffle.getLatestTimeStamp();
					const accounts = await ethers.getSigners();

					//setting up listener before entering the raffle
					await new Promise(async (resolve, reject) => {
						raffle.once("WinnerPicked", async () => {
							console.log("WinnerPicekd event fired");
							try {
								const recentWinner =
									await raffle.getRecentWinner();
								const raffleState =
									await raffle.getRaffleState();
								//since ony our deployer entered the lottery
								const winnerEndingBalance =
									await accounts[0].getBalance();
								const endingTimeStamp =
									await raffle.getLatestTimeStamp();

								await expect(raffle.getPlayer(0)).to.be
									.reverted;
								assert.equal(
									//since only single player is participating
									recentWinner.toString(),
									accounts[0].address
								);
								assert.equal(raffleState, 0);
								assert.equal(
									winnerEndingBalance.toString(),
									winnerStartingBalance
										.add(raffleEntranceFee)
										.toString()
								);
								assert(endingTimeStamp > startingTimeStamp);
								resolve();
							} catch (e) {
								console.log(e);
								reject(e);
							}
						});
						await raffle.enterRaffle({ value: raffleEntranceFee });
						const winnerStartingBalance =
							await accounts[0].getBalance();
					});
				});
			});
	  });
