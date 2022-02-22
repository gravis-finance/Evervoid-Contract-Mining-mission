//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ITypedNFT.sol";
import "./interfaces/IMintableToken.sol";
import "./interfaces/IReferralStorage.sol";
import "./interfaces/IMiningV1.sol";

contract ProlongedMiningV2 is OwnableUpgradeable {

    uint256 constant DECIMAL_PRECISION = 1;
    uint256 constant MAX_DURATION_BONUS = 90 * 10**DECIMAL_PRECISION;

    ITypedNFT public skins;

    IMintableToken public scrap;

    ITypedNFT public veterans;

    IMintableToken public grvx;

    ITypedNFT public vouchers;

    IReferralStorage public referralStorage;

    struct ShipTypeInfo {
        uint256 reward;
        uint256 stakingDuration;
        uint256 minScrap;
        uint256 maxScrap;
    }
    
    mapping(address => mapping(uint256 => ShipTypeInfo)) public shipTypeInfo;

    mapping(address => mapping(uint256 => mapping(uint256 => ShipTypeInfo))) public shipTypeProlongedInfo;

    struct CaptainTypeInfo {
        bool allowed;
        uint256 veteranTypeId;
    }

    mapping(address => mapping(uint256 => CaptainTypeInfo)) public captainTypeInfo;

    struct EquipmentTypeInfo {
        bool allowed;
        uint256 minDurationBonus;
        uint256 maxDurationBonus;
        uint256 minRewardBonus;
        uint256 maxRewardBonus;
    }

    mapping(address => mapping(uint256 => EquipmentTypeInfo)) public equipmentTypeInfo;

    mapping(address => mapping(uint256 => EquipmentTypeInfo)) public equipmentTypeProlongedInfo;

    struct Stake {
        uint256 id;
        address owner;
        uint256 startBlock;
        uint256 endBlock;
        uint256 grvxReward;
        uint256 minScrap;
        uint256 maxScrap;
        uint256 veteranTypeId;
        bool both;
        bool claimed;
        uint256 prolongedType;
    }

    mapping(uint256 => Stake) public stakes;

    struct StakeExtra {
        address shipContract;
        uint256 shipTypeId;
        address captainContract;
        uint256 captainTypeId;
        uint256 scrapQuantity;
        uint256 veteranId;
        uint256 voucherId;
        uint256 skinId;
        address[] equipmentContracts;
        uint256[] equipmentTypeIds;
    }

    mapping(uint256 => StakeExtra) public stakesExtra;

    mapping(address => uint256[]) public stakeIds;

    bool public stakeDisabled;

    uint256 private _lastStakeId;

    uint256 private _randomNonce;

    // CONSTRUCTOR

    constructor() {}

    function initialize(
        address grvx_,
        address vouchers_,
        address scrap_,
        address veterans_,
        address skins_,
        address referralStorage_
    ) public initializer {
        __Ownable_init();

        grvx = IMintableToken(grvx_);
        vouchers = ITypedNFT(vouchers_);
        scrap = IMintableToken(scrap_);
        veterans = ITypedNFT(veterans_);
        skins = ITypedNFT(skins_);
        referralStorage = IReferralStorage(referralStorage_);
    }

    // PUBLIC FUNCTIONS

    function stake(
        address shipContract,
        uint256 shipId,
        address captainContract,
        uint256 captainId,
        uint256 skinId,
        address[] calldata equipmentContracts,
        uint256[] calldata equipmentIds,
        address referrer
    ) external returns (uint256) {
        return _stake(
            shipContract,
            shipId,
            captainContract,
            captainId,
            skinId,
            type(uint256).max,
            equipmentContracts,
            equipmentIds,
            referrer
        );
    }

    function stakeProlonged(
        address shipContract,
        uint256 shipId,
        address captainContract,
        uint256 captainId,
        uint256 skinId,
        uint256 prolongedType,
        address[] calldata equipmentContracts,
        uint256[] calldata equipmentIds,
        address referrer
    ) external returns (uint256) {
        return _stake(
            shipContract,
            shipId,
            captainContract,
            captainId,
            skinId,
            prolongedType,
            equipmentContracts,
            equipmentIds,
            referrer
        );
    }

    function claim(uint256 stakeId) external {

        require(msg.sender == stakes[stakeId].owner, "Sender isn't stake owner");
        require(block.number >= stakes[stakeId].endBlock, "Can't claim yet");
        require(!stakes[stakeId].claimed, "Stake is already claimed");

        stakes[stakeId].claimed = true;
        for (uint256 i = 0; i < stakeIds[msg.sender].length; i++) {
            if (stakeIds[msg.sender][i] == stakeId) {
                stakeIds[msg.sender][i] = stakeIds[msg.sender][stakeIds[msg.sender].length - 1];
                stakeIds[msg.sender].pop();
                break;
            }
        }

        // Transfer rewards

        grvx.mint(msg.sender, stakes[stakeId].grvxReward);

        if (stakes[stakeId].both) {
            stakesExtra[stakeId].voucherId = vouchers.mint(
                msg.sender,
                stakesExtra[stakeId].captainTypeId,
                1
            ) - 1;
        }

        if (stakesExtra[stakeId].skinId != type(uint256).max) {
            skins.transferFrom(address(this), msg.sender, stakesExtra[stakeId].skinId);
        }

        if (stakes[stakeId].prolongedType != type(uint256).max) {
            ITypedNFT(stakesExtra[stakeId].shipContract).transferFrom(
                address(this),
                msg.sender,
                stakesExtra[stakeId].shipTypeId
            );
            for (uint256 i = 0; i < stakesExtra[stakeId].equipmentContracts.length; i++) {
                ITypedNFT(stakesExtra[stakeId].equipmentContracts[i]).transferFrom(
                    address(this),
                    msg.sender,
                    stakesExtra[stakeId].equipmentTypeIds[i]
                );
            }
        }

        uint256 scrapQuantity;
        if (stakes[stakeId].maxScrap > 0) {
            scrapQuantity = _random(
                stakes[stakeId].minScrap,
                stakes[stakeId].maxScrap
            );
        }
        stakesExtra[stakeId].scrapQuantity = scrapQuantity;
        if (scrapQuantity > 0) {
            scrap.mint(msg.sender, scrapQuantity * 10**18);
        }
        
        if (stakes[stakeId].both) {
            stakesExtra[stakeId].veteranId = veterans.mint(
                msg.sender,
                stakes[stakeId].veteranTypeId,
                1
            ) - 1;
        }
    }

    // OWNER FUNCTIONS

    function setShipType(
        address shipContract,
        uint256 typeId,
        uint256 reward,
        uint256 stakingDuration,
        uint256 minScrap,
        uint256 maxScrap
    ) external onlyOwner {
        shipTypeInfo[shipContract][typeId] = ShipTypeInfo({
            reward: reward, 
            stakingDuration: stakingDuration,
            minScrap: minScrap,
            maxScrap: maxScrap
        });
    }

    function setShipTypeProlonged(
        address shipContract,
        uint256 typeId,
        uint256 prolongedType,
        uint256 reward,
        uint256 stakingDuration
    ) external onlyOwner {
        shipTypeProlongedInfo[shipContract][typeId][prolongedType] = ShipTypeInfo({
            reward: reward, 
            stakingDuration: stakingDuration,
            minScrap: 0,
            maxScrap: 0
        });
    }

    function setCaptainType(
        address captainContract,
        uint256 typeId,
        bool allowed,
        uint256 veteranTypeId
    ) external onlyOwner {
        captainTypeInfo[captainContract][typeId] = CaptainTypeInfo({
            allowed: allowed,
            veteranTypeId: veteranTypeId
        });
    }

    function setEquipmentType(
        address equipmentContract,
        uint256 typeId,
        bool allowed,
        uint256 minDurationBonus,
        uint256 maxDurationBonus,
        uint256 minRewardBonus,
        uint256 maxRewardBonus
    ) external onlyOwner {
        require(maxDurationBonus <= MAX_DURATION_BONUS, "Duration bonus can not be greater than 90%");
        require(maxDurationBonus >= minDurationBonus, "Max duration bonus should be not less than min duration bonus");
        require(maxRewardBonus >= minRewardBonus, "Max reward bonus should be not less than min reward bonus");
        equipmentTypeInfo[equipmentContract][typeId] = EquipmentTypeInfo({
            allowed: allowed,
            minDurationBonus: minDurationBonus,
            maxDurationBonus: maxDurationBonus,
            minRewardBonus: minRewardBonus,
            maxRewardBonus: maxRewardBonus
        });
    }

    function setEquipmentTypeProlonged(
        address equipmentContract,
        uint256 typeId,
        bool allowed,
        uint256 minDurationBonus,
        uint256 maxDurationBonus,
        uint256 minRewardBonus,
        uint256 maxRewardBonus
    ) external onlyOwner {
        require(maxDurationBonus <= MAX_DURATION_BONUS, "Duration bonus can not be greater than 90%");
        require(maxDurationBonus >= minDurationBonus, "Max duration bonus should be not less than min duration bonus");
        require(maxRewardBonus >= minRewardBonus, "Max reward bonus should be not less than min reward bonus");
        equipmentTypeProlongedInfo[equipmentContract][typeId] = EquipmentTypeInfo({
            allowed: allowed,
            minDurationBonus: minDurationBonus,
            maxDurationBonus: maxDurationBonus,
            minRewardBonus: minRewardBonus,
            maxRewardBonus: maxRewardBonus
        });
    }

    function setStakeDisabled(bool disabled) external onlyOwner {
        stakeDisabled = disabled;
    }

    function setVouchersContract(address vouchers_) external onlyOwner {
        vouchers = ITypedNFT(vouchers_);
    }

    function setScrapContract(address scrap_) external onlyOwner {
        scrap = IMintableToken(scrap_);
    }

    function setSkinsContract(address skins_) external onlyOwner {
        skins = ITypedNFT(skins_);
    }

    function blockStake(uint256 stakeId) external onlyOwner {
        require(stakes[stakeId].owner != address(0), "Stake does not exist");
        require(!stakes[stakeId].claimed, "Already claimed");
        stakes[stakeId].claimed = true;
        address account = stakes[stakeId].owner;
        for (uint256 i = 0; i < stakeIds[account].length; i++) {
            if (stakeIds[account][i] == stakeId) {
                stakeIds[account][i] = stakeIds[account][stakeIds[account].length - 1];
                stakeIds[account].pop();
                break;
            }
        }
    }

    function unblockStake(uint256 stakeId) external onlyOwner {
        require(stakes[stakeId].owner != address(0), "Stake does not exist");
        require(stakes[stakeId].claimed, "Not blocked");
        stakes[stakeId].claimed = false;
        stakeIds[stakes[stakeId].owner].push(stakeId);
    }

    function setReferralStorage(address referralStorage_) external onlyOwner {
        referralStorage = IReferralStorage(referralStorage_);
    }

    // VIEW FUNCTIONS

    function stakesOf(
        address account
    ) external view returns (
        Stake[] memory accountStakes, StakeExtra[] memory accountStakesExtra
    ) {
        accountStakes = new Stake[](stakeIds[account].length);
        for (uint256 i = 0; i < stakeIds[account].length; i++) {
            accountStakes[i] = stakes[stakeIds[account][i]];
        }
        accountStakesExtra = new StakeExtra[](stakeIds[account].length);
        for (uint256 i = 0; i < stakeIds[account].length; i++) {
            accountStakesExtra[i] = stakesExtra[stakeIds[account][i]];
        }
    }

    function stakedEquipment(uint256 stakeId) external view returns (address[] memory, uint256[] memory) {
        return (stakesExtra[stakeId].equipmentContracts, stakesExtra[stakeId].equipmentTypeIds);
    }

    // PRIVATE FUNCTIONS 

    function _stakeShip(
        address shipContract,
        uint256 shipId,
        uint256 prolongedType,
        address[] memory equipmentContracts,
        uint256[] memory equipmentIds
    ) private returns (Stake memory newStake, StakeExtra memory newStakeExtra) {
        ITypedNFT ships = ITypedNFT(shipContract);
        uint256 shipTypeId = ships.getTokenType(shipId);
        

        ships.transferFrom(msg.sender, address(this), shipId);
        ShipTypeInfo memory shipInfo;
        if (prolongedType == type(uint256).max) {
            ships.burn(shipId);
            shipInfo = shipTypeInfo[shipContract][shipTypeId];    
        } else {
            shipInfo = shipTypeProlongedInfo[shipContract][shipTypeId][prolongedType];
        }
        require(shipInfo.reward != 0, "No staking available for this ship type");

        (uint256 rewardBonus, uint256 durationBonus, uint256[] memory equipmentTypeIds) = _checkEquipment(
            prolongedType,
            equipmentContracts,
            equipmentIds
        );
        uint256 duration = shipInfo.stakingDuration - shipInfo.stakingDuration * durationBonus / (100 * 10**DECIMAL_PRECISION);

        _lastStakeId++;
        newStake = Stake({
            id: _lastStakeId,
            owner: msg.sender,
            startBlock: block.number,
            endBlock: block.number + duration,
            grvxReward: shipInfo.reward + rewardBonus * 10**18,
            minScrap: shipInfo.minScrap,
            maxScrap: shipInfo.maxScrap,
            veteranTypeId: 0,
            both: false,
            claimed: false,
            prolongedType: prolongedType
        });
        newStakeExtra = StakeExtra({
            shipContract: shipContract,
            shipTypeId: shipTypeId,
            captainContract: address(0),
            captainTypeId: 0,
            scrapQuantity: 0,
            veteranId: 0,
            voucherId: 0,
            skinId: 0,
            equipmentContracts: equipmentContracts,
            equipmentTypeIds: equipmentTypeIds
        });
    }

    function _stake(
        address shipContract,
        uint256 shipId,
        address captainContract,
        uint256 captainId,
        uint256 skinId,
        uint256 prolongedType,
        address[] memory equipmentContracts,
        uint256[] memory equipmentIds,
        address referrer
    ) private returns (uint256) {
        require(!stakeDisabled, "Staking is disabled");

        (Stake memory newStake, StakeExtra memory newStakeExtra) = _stakeShip(
            shipContract,
            shipId,
            prolongedType,
            equipmentContracts,
            equipmentIds
        );

        if (skinId != type(uint256).max) {
            skins.transferFrom(msg.sender, address(this), skinId);
        }
        newStakeExtra.skinId = skinId;

        if (captainContract != address(0)) {
            ITypedNFT captains = ITypedNFT(captainContract);

            uint256 captainTypeId = captains.getTokenType(captainId);
            CaptainTypeInfo storage captainInfo = captainTypeInfo[captainContract][captainTypeId];
            require(captainInfo.allowed, "No staking available for this captain type");
            
            captains.transferFrom(msg.sender, address(this), captainId);
            captains.burn(captainId);

            newStake.both = true;
            newStake.veteranTypeId = captainInfo.veteranTypeId;
            newStakeExtra.captainContract = captainContract;
            newStakeExtra.captainTypeId = captainTypeId;
        }

        stakes[_lastStakeId] = newStake;
        stakesExtra[_lastStakeId] = newStakeExtra;
        stakeIds[msg.sender].push(_lastStakeId);

        if (referrer != address(0)) {
            referralStorage.refer(msg.sender, referrer);
        }

        return _lastStakeId;
    }

    function _checkEquipment(
        uint256 prolongedType,
        address[] memory equipmentContracts,
        uint256[] memory equipmentIds
    ) private returns (
        uint256 rewardBonus,
        uint256 durationBonus,
        uint256[] memory equipmentTypeIds
    ) {
        require(equipmentContracts.length == equipmentIds.length, "Equipment length mismatch");

        equipmentTypeIds = new uint256[](equipmentIds.length);

        for (uint8 i = 0; i < equipmentIds.length; i++) {
            ITypedNFT equipment = ITypedNFT(equipmentContracts[i]);
            
            uint256 typeId = equipment.getTokenType(equipmentIds[i]);
            equipment.transferFrom(msg.sender, address(this), equipmentIds[i]);

            EquipmentTypeInfo memory equipmentInfo;
            if (prolongedType == type(uint256).max) {
                equipmentInfo = equipmentTypeInfo[equipmentContracts[i]][typeId];
                equipment.burn(equipmentIds[i]);
            } else {
                equipmentInfo = equipmentTypeProlongedInfo[equipmentContracts[i]][typeId];
            }  

            require(equipmentInfo.allowed, "This equipment type is not allowed");

            for (uint256 j = 0; j < i; j++) {
                require(equipmentContracts[j] != equipmentContracts[i], "Equipment slot already occupied");
            }

            equipmentTypeIds[i] = typeId;

            rewardBonus += _random(equipmentInfo.minRewardBonus, equipmentInfo.maxRewardBonus);
            durationBonus += _random(equipmentInfo.minDurationBonus, equipmentInfo.maxDurationBonus);
        }

        if (durationBonus > MAX_DURATION_BONUS) {
            durationBonus = MAX_DURATION_BONUS;
        }
    }

    function _random(uint256 from, uint256 to) private returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            _randomNonce
        )));
        _randomNonce++;
        return from + (random % (to - from + 1));
    }
}
