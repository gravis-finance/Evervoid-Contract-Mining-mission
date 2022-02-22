//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./MiningV2.sol";
import "./RandomConsumerBase.sol";

contract MiningRandomConsumer is MiningV2, RandomConsumerBase {

    // requestId => stakeId
    mapping (bytes32 => uint256) private requestIds;

    // stakeId => randomness
    mapping (uint256 => uint256) private stakeRandom;

    // event RandomFullfilled(uint256 indexed stakeId);

    function setCoordinator(address coordinatorAddr) public onlyOwner {
        _setCoordinator(coordinatorAddr);
    }

    function checkRand(uint256 stakeId) public view returns (bool) {
        require(stakeRandom[stakeId] != 0, "stakeId not exist or claimed");
        return (stakeRandom[stakeId] != 1);
    }

    function sendShip(uint256 stakeId) public {
        require(checkRand(stakeId), "random not ready");
        require(stakes[stakeId].endBlock == 0, "ship already sended");

        StakeExtra memory extra = stakesExtra[stakeId];
        ShipTypeInfo storage shipInfo = shipTypeInfo[extra.shipContract][extra.shipTypeId];

        uint256 rewardBonus;
        uint256 durationBonus;
        for (uint8 i = 0; i < extra.equipmentTypeIds.length; i++) {
            EquipmentTypeInfo memory equipmentInfo = equipmentTypeInfo[extra.equipmentContracts[i]][extra.equipmentTypeIds[i]];
            rewardBonus+= _random(stakeId, equipmentInfo.minRewardBonus, equipmentInfo.maxRewardBonus);
            durationBonus+= _random(stakeId, equipmentInfo.minDurationBonus, equipmentInfo.maxDurationBonus);
        }

        uint256 duration = shipInfo.stakingDuration - shipInfo.stakingDuration * durationBonus / (100 * 10**DECIMAL_PRECISION);
        stakes[stakeId].startBlock = block.number;
        stakes[stakeId].endBlock = block.number + duration;
        stakes[stakeId].grvxReward = shipInfo.reward + rewardBonus * 10**18;
    }

    function _onStakeStart() internal override {
        bytes32 requestId = requestRandomness();
        requestIds[requestId] = _lastStakeId;
        stakeRandom[_lastStakeId] = 1;
        stakes[_lastStakeId].startBlock = 0; // TODO: if start from sendShip
        stakes[_lastStakeId].endBlock = 0; // TODO: if start from sendShip
    }

    function _equipmentBonuses(EquipmentTypeInfo memory equipmentInfo) internal pure override returns (
        uint256 rewardBonus,
        uint256 durationBonus
    ) {
        return (0, 0);
    }

    function _random(uint256 stakeId, uint256 from, uint256 to) internal view override returns (uint256) {
        uint256 randomness = stakeRandom[stakeId];
        require(randomness != 1, 'random not ready');
        require(randomness != 0, 'random already used'); //

        // delete stakeRandom[stakeId]; // TODO maybe on claim

        uint256 random = uint256(
            keccak256(
                abi.encodePacked(
                    randomness
                    // randomSeed
                )
            )
        );
        return _randomPercent(random, from, to);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        uint256 stakeId = requestIds[requestId];
        require(stakeId != 0, 'Request not found');

        delete requestIds[requestId]; //

        stakeRandom[stakeId] = randomness;
        // emit RandomFullfilled(stakeId);
    }
}
