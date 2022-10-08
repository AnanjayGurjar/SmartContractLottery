//Goals:

//Enter the lottery(by paying some amount)
// Pick a random winner (verifiabely random)
// Winner to be selected every X minutes -> completely random
// Chainlink Oracle -> Randomness, Automated Execution (Chainlink Keeper)

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

//we need to inherit VRFConsumerBase
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error Raffle__NotEnoughEthEntered();

contract Raffle is VRFConsumerBaseV2 {
	/*State Variables*/
	uint256 private immutable i_entranceFee;
	//payable since we need to pay the players if they win
	address payable[] private s_players;

	/* Events */
	event RaffleEnter(address indexed player);

	//verfCoordinator is the address of the contract that does the random number verification
	constructor(address vrfCorrdinatorV2, uint256 entranceFee)
		VRFConsumerBaseV2(vrfCorrdinatorV2)
	{
		i_entranceFee = entranceFee;
	}

	function enterRaffle() public payable {
		if (msg.value < i_entranceFee) {
			revert Raffle__NotEnoughEthEntered();
		}
		//since, msg.sender is not a payable address we need to typecast it to payable
		s_players.push(payable(msg.sender));

		//emiting the event(as we update any dynamic array or mapping)
		emit RaffleEnter(msg.sender);
	}

	function pickRandomWinner() private {}

	//fulfill random numbers
	function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
		internal
		override
	{}

	function getEntranceFee() public view returns (uint256) {
		return i_entranceFee;
	}

	function getPlayer(uint256 index) public view returns (address) {
		return s_players[index];
	}
}