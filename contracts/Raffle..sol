//Goals:

//Enter the lottery(by paying some amount)
// Pick a random winner (verifiabely random)
// Winner to be selected every X minutes -> completely random
// Chainlink Oracle -> Randomness, Automated Execution (Chainlink Keeper)

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

//we need to inherit VRFConsumerBase
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Raffle__NotEnoughEthEntered();
error Raffle__TransferFailed();
error Raffle__NotOpen();

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
	/* Type declarations */
	enum RaffleState {
		OPEN,
		CALCULATING
	}
	/*State Variables*/
	uint256 private immutable i_entranceFee;
	//payable since we need to pay the players if they win
	address payable[] private s_players;
	VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
	bytes32 private immutable i_gasLane;
	uint64 private immutable i_subscriptionId;
	uint32 private immutable i_callbackGasLimit;
	uint16 private constant REQUEST_CONFIRMATIONS = 3;
	uint16 private constant NUM_WORDS = 1;

	//Lottery Variables
	address private s_recentWinner;
	RaffleState private s_raffleState;

	/* Events */
	event RaffleEnter(address indexed player);
	event RequestedRaffleWinner(uint256 indexed requestId);
	event WinnerPicked(address indexed winner);

	//verfCoordinator is the address of the contract that does the random number verification
	constructor(
		address vrfCoordinatorV2,
		uint256 entranceFee,
		bytes32 gasLane,
		uint64 subscriptionId,
		uint32 callbackGasLimit
	) VRFConsumerBaseV2(vrfCoordinatorV2) {
		i_entranceFee = entranceFee;
		i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
		i_gasLane = gasLane;
		i_subscriptionId = subscriptionId;
		i_callbackGasLimit = callbackGasLimit;
		s_raffleState = RaffleState.OPEN;
	}

	function enterRaffle() public payable {
		if (msg.value < i_entranceFee) {
			revert Raffle__NotEnoughEthEntered();
		}
		if (s_raffleState != RaffleState.OPEN) {
			revert Raffle__NotOpen();
		}
		//since, msg.sender is not a payable address we need to typecast it to payable
		s_players.push(payable(msg.sender));

		//emiting the event(as we update any dynamic array or mapping)
		emit RaffleEnter(msg.sender);
	}

	/**
	 * @dev This is the function that the chainlink keeper nodes call they look for the 'upkeepNeeded' return true
	 * The following should be true in order to return true:
	 *	1. Our time interval should have passed
	 *  2. The lottery should have atleast one player and have some eth
	 * 	3. Our subscription is funded with LINK
	 * 	4. Lottery should be in open state
	 */

	function checkUpkeep(
		bytes calldata /*checkData*/
	) external override {}

	function requestRandomWinner() external {
		//two tarnsaction process: 1. request the random number 2. Do something with it
		s_raffleState = RaffleState.CALCULATING;
		uint256 requestId = i_vrfCoordinator.requestRandomWords(
			i_gasLane, //gasLane : the maximum gas price you are willing to pay for a request in wei.
			i_subscriptionId, //subscription that we need to fund the requests
			REQUEST_CONFIRMATIONS, //how many confirmations should chainlink node wait befor responding
			i_callbackGasLimit, //limit for how much gas to use for the callback request to your contract's fulfillRandomWords()
			NUM_WORDS //number of random numbers we want to get
		);
		emit RequestedRaffleWinner(requestId);
	}

	//fulfill random numbers
	function fulfillRandomWords(
		uint256, /*requestId*/
		uint256[] memory randomWords
	) internal override {
		uint256 indexOfWinner = randomWords[0] % s_players.length;
		address payable recentWinner = s_players[indexOfWinner];
		s_recentWinner = recentWinner;
		s_raffleState = RaffleState.OPEN;
		s_players = new address payable[](0);
		(bool success, ) = recentWinner.call{value: address(this).balance}("");
		if (!success) {
			revert Raffle__TransferFailed();
		}
		emit WinnerPicked(recentWinner);
	}

	function getEntranceFee() public view returns (uint256) {
		return i_entranceFee;
	}

	function getPlayer(uint256 index) public view returns (address) {
		return s_players[index];
	}

	function getRecentWinner() public view returns (address) {
		return s_recentWinner;
	}
}
