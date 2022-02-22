# Evervoid Contract Mining mission

This contract is used to send ships on the Evervoid mission. The main contract url:
Polygon: https://polygonscan.com/address/0x84678BCF5C2B99bC741aC42818E4e8ade9B6e979
BSC: https://bscscan.com/address/0xE16f41Ba2c3d77BeA97a4BC0819D06aB3A57e597

This contract is used on the page:  https://evervo.id/hangar?network=56

## Compile

Copy `example.env` into a new `.env` file and fill it with values.

```
npx hardhat compile
```

## Test

```
npx hardhat test
```

## Deploy mining.

Open the file scripts/deploy-prolonged.js and replace the empty address variables with the correct values. Then run:

```
npx hardhat run scripts/deploy-prolonged.js --network [Your Network]
```

## Update mining.

Open the scripts/upgrade-prolonged.js file and replace the proxy address with your proxy address. Then execute:

```
npx hardhat run scripts/upgrade-prolonged.js --network [Your Network]
```

## Configuration.

To connect to the contract through the hardhat console, run the following commands from the command line in the repository:

```
npx hardhat --network [Your network] console
```

```
mining = await ethers.getContractAt("ProlongedMiningV2", "[Mining proxy address]");
```

To set the contract, call the desired function according to the documentation below, for example:

```
await mining.setCaptainContract("[Captain Contract Address]", true)
```

## Documentation for long mining functions

The contract generally corresponds in interface to normal mining version 2 (see README). Additional or different methods are described here

### Constructor

``jsx
initialize(
    grvx_ address,
    voucher address_,
    scrap address_,
    veterans address_,
    address skins_,
    address referralStorage_,
)
```

**Parameters**

- grvx address\_ - GRVX contract address (ERC20)
- voucher address\_ - voucher contract address (ERC721)
- scrap\_ address - metal contract address (ERC20)
- veterans\_ - address of veterans contract (ERC721)
- skins\_ - address of the skins contract (ERC721)
- referralStorage\_ - address of referral contract

### Stack Extended

The steak function for extended mining. Allows you to stack any allowed set of tokens (ship or ship and captain, plus optional skin and/or gear).
Must have permission from the contract to mine transferable tokens.
``jsx.
function stake(
    shipContract address,
    uint256 shipId,
    address captainContract,
    uint256 captainId,
    uint256 skinId,
    uint256 prolongedType,
    address[] calldata equipmentContracts,
    uint256[] calldata equipmentIds,
    referrer address
) external returns (uint256)
```

**Parameters**

- address shipContract - address of the ship contract that makes up the ship
- uint256 shipId - ship token identifier
- address captainContract - the address of the captain contract which is used to stack the captain (zero address if the stack has no captain)
- uint256 captainId - token identifier of the captain (any number if the captain is absent)
- uint256 skinId - skin token identifier (if no skin, MAX_UINT_256)
- uint256 prolongedType - identifier of the mining type (type must be allowed)
- address[] equipmentContracts - array of equipment contracts (empty if there is no equipment; no duplicates)
- uint256[] equipmentIds - array of identifiers of equipment tokens (must match the length of equipmentContracts)
- address referrer - address of referrer, if any (zero if not).

Translated by www.DeepL.com/Translator (free version)

**Returned value**

Steak ID

### Set vessel type Extended

The function allows you to set the parameters of the extended vessel type control. Can only be called by the contract owner.

``jsx
function setShipTypeProlonged(
    shipContract address,
    uint256 typeId,
    uint256 prolongedType,
    uint256 remuneration,
    uint256 stakingDuration,
    uint256 minScrap,
    uint256 maxScrap
)
```

**Parameters**

- shipContract address - address of the ship contract where the type is set
- uint256 typeId - identifier of the ship type that is being changed
- uint256 prolongedType - identifier of the prolonged stow type
- uint256 reward - total reward for prolonged staking of a given token type
- uint256 stakingDuration - the duration of extended stacking of tokens in blocks

### Set Equipment Type Prolonged

The function allows setting the parameters of the prolonged staking of the equipment type. Can only be called by the contract holder.

``jsx
function setEquipmentType(
    address equipmentContract,
    uint256 typeId,
    bool allowed,
    uint256 minDurationBonus,
    uint256 maxDurationBonus,
    uint256 minRewardBonus,
    uint256 maxRewardBonus
)
```

**Parameters**

- address equipmentContract - address of the equipment contract where the type is configured
- uint256 typeId - ID of the customizable type
- bool allowed - whether extended stealing of this type is allowed
- uint256 minDurationBonus - minimum duration bonus in percent
- uint256 maxDurationBonus - maximum duration bonus in percent
- uint256 minRewardBonus - minimum reward bonus in percent
- uint256 maxRewardBonus - maximum reward bonus in ether

### Stakes

Returns basic information about the steak by its ID

``jsx
stakes(uint256 stakeId) returns (Stake)
```

**Parameters**

- uint256 stakeId - steak ID

**Return**

- uint256 id - steak ID
- address owner - steak owner
- uint256 startBlock - block of the beginning of the steak
- uint256 endBlock - end block of the steak
- uint256 grvxReward - total steak reward in GRVX (wei)
- uint256 minScrap - minimum possible amount of metal
- uint256 maxScrap - maximum possible amount of metal
- uint256 veteranTypeId - the type of veteran being awarded
- bool both - true if there is a captain in the steak, false otherwise
- bool claimed - true if a reward is taken, false otherwise
- uint256 prolongedType - type of prolonged steaking (MAX_UINT_256 for regular steaking)
