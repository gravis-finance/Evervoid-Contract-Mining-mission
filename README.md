# Evervoid contract Mining mission 

This contract is used to send ships on the Evervoid mission. The main contract url:
Polygon: https://polygonscan.com/address/0x84678BCF5C2B99bC741aC42818E4e8ade9B6e979
BSC: https://bscscan.com/address/0xE16f41Ba2c3d77BeA97a4BC0819D06aB3A57e597

This contract is used on the page:  https://evervo.id/hangar?network=56

## Compile

Copy `example.env` to a new file called `.env` and fill the values in it.

```
npx hardhat compile
```

## Test

```
npx hardhat test
```

## Deploy Mining

Open file scripts/deploy.js and replace empty address variables with correct values. Then run:

```
npx hardhat run scripts/deploy.js --network [Your Network]
```

## Upgrade Mining

Open file scripts/upgrade.js and replace proxy address with your proxy address. Then run:

```
npx hardhat run scripts/upgrade.js --network [Your Network]
```
## Configuration

To connect to the contract via hardhat console, run the following commands from the command line in the repository:
```
npx hardhat --network [Your network] console
```

```
mining = await ethers.getContractAt("MiningV2", "[Mining proxy address]");
```

To set up the contract, then call the desired function according to the documentation below, e.g:

```
await mining.setCaptainContract("[Captain contract address]", true)
```

## Mining Functions Docs

### Constructor

```jsx
initialize(
    address grvx_,
    address vouchers_,
    address scrap_,
    address veterans_,
    address skins_,
    address referralStorage_,
    address miningV1_
)
```

**Parameters**

- address grvx\_ - address of GRVX contract (ERC20)
- address vouchers\_ - address of voucher contract (ERC721)
- address scrap\_ - address of metal contract (ERC20)
- address veterans\_ - address of veterans contract (ERC721)
- address skins\_ - address skins contract (ERC721)
- address referralStorage\_ - address of referral storage contract
- address miningV1\_ - address of old mining contract (V1)

### Stake

Stacking Function. Allows you to stack any allowed set of tokens (ship or ship with a captain, plus optional skin and/or gear).
Must be granted permission by the mining contract for the transferred tokens.

```jsx
function stake(
    address shipContract,
    uint256 shipId,
    address captainContract,
    uint256 captainId,
    uint256 skinId,
    address[] calldata equipmentContracts,
    uint256[] calldata equipmentIds,
    address referrer
) external returns (uint256)
```

**Parameters**

- address shipContract - address of the ship contract from which the ship is stacked
- uint256 shipId - ship token ID
- address captainContract - the address of the captain contract from which the captain is steamed (zero address if the steak has no captain)
- uint256 captainId - captain's token ID (any number if there is no captain)
- uint256 skinId - skin token ID (if no skin, MAX_UINT_256)
- address[] equipmentContracts - array of equipment contracts (empty if there is no equipment; no duplicates)
- uint256[] equipmentIds - array of equipment token IDs (must match the length of equipmentContracts)
- address referrer - address of referrer, if there is one (zero address if not)

**Return value**

ID stake

### Claim Reward

The function is used to get the reward for the steak at the end (and display a skin if it was present)

```jsx
function claimReward(uint256 stakeId)
```

**Parameters**

- uint256 stakeId - ID of the steak from which the reward is collected

### Set Ship Type

The function allows you to set the parameters of the ship type steering. Can only be called by the contract owner.

```jsx
function setShipType(
    address shipContract,
    uint256 typeId,
    uint256 reward,
    uint256 stakingDuration,
    uint256 minScrap,
    uint256 maxScrap
)
```

**Parameters**

- address shipContract - address of the ship contract where the type is set
- uint256 typeId - ID of the ship type that is being changed
- uint256 reward - the total reward for staking this type of token
- uint256 stakingDuration - the duration of token staking in blocks
- uint256 minScrap - the lower limit of the range of the number of pieces of metal to be obtained
- uint256 maxScrap - the upper limit of the range of the number of pieces of metal to be produced

### Set Captain Type

The function allows you to set the steering parameters of the captains type. Can only be called by the contract owner.

```jsx
function setCaptainType(
    address captainContract,
    uint256 typeId,
    bool allowed,
    uint256 veteranTypeId
)
```

**Parameters**

- address captainContract - address of the captains contract, where the type is set
- uint256 typeId - ID of the token type which is being changed
- bool allowed - whether this type is allowed (true) or denied (false)
- uint256 veteranTypeId - type of veteran token given for steaking this type of token

### Set Equipment Type

The function allows you to set the parameters of the equipment type steaking. Can only be called by the contract holder.

```jsx
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
- bool allowed - whether steaking of this type is allowed
- uint256 minDurationBonus - minimum duration bonus in percent
- uint256 maxDurationBonus - maximum duration bonus in percent
- uint256 minRewardBonus - minimum reward bonus in ether
- uint256 maxRewardBonus - maximum reward bonus in ether

### Set Vouchers Contract

The function allows you to set a new voucher contract

``jsx
function setVouchersContract(address vouchers_)
```

**Parameters**

- address vouchers\_ - address of vouchers contract

### Set Scrap Contract

The function allows you to set a new metal contract

``jsx
function setScrapContract(address scrap_)
```

**Parameters**

- address scrap\_ - address of the metal contract

**Parameters**

- address equipment\_ - address of equipment contract

### Set Skins Contract

The function allows you to set a new skins contract

``jsx
function setSkinsContract(address skins_)
```

**Parameters**

- address skins\_ - address of skins contract

## Contract View Functions

### Ship Contract Allowed

Returns the address of the contract if it is allowed as a ships contract

``jsx
shipContractAllowed(address contract)
```

**Parameters**

- address contract - address contract

**Return**

True if allowed, false otherwise

### Captain Contract Allowed

Returns the address of the contract if it is allowed as a captain contract

``jsx
captainContractAllowed(address contract)
```

**Parameters**

- address - address contract

**Return**

True if allowed, false otherwise

### Captain Contract Allowed

Returns the contract address to see if it is allowed as an equipment contract

``jsx
equipmentContractAllowed(address contract)
```

**Parameters**

- address - address contract

**Return**

True if allowed, false otherwise

### Skins

Returns the skins contract address

``jsx
skins();
```

### Scrap

Returns the metal contract address

``jsx
scrap();
```

## Veterans

Returns the address of the veterans contract

``jsx
veterans();
```

### Vouchers

Returns the address of the vouchers contract

``jsx
vouchers();
```

### Referral Storage

Returns the address of the referral storage contract

``jsx
referralStorage();
```

### Ship Type Info

Returns by contract address and token type ID information about the mining of this ship type

``jsx
shipTypeInfo(address contract, uint256 typeId) returns (ShipTypeInfo)
```

**Parameters**

- address contract - ships contract
- uint256 typeId - type of ships on this contract

**Return**

- uint256 reward - reward in GRVX (wei)
- uint256 stakingDuration - mining duration in blocks
- uint256 minScrap - minimum possible amount of metal (in ether)
- uint256 maxScrap - maximum possible amount of metal (in ether)

### Captain Type Info

Returns by contract address and token type ID information about the mining of this captain type

``jsx
captainTypeInfo(address contract, uint256 typeId) returns (CaptainTypeInfo)
```

**Parameters**

- address contract - captains contract
- uint256 typeId - type of captains on this contract

**Return**

- bool allowed - whether mining of this type is allowed
- uint256 veteranTypeId - the type of veteran issued for this captain type

### Equipment Type Info

Returns by equipment type information about mining of this type

``jsx
EquipmentTypeInfo(uint256 typeId) returns (EquipmentTypeInfo)
```

**Parameters**

- uint256 typeId - type of equipment

**Return**

- bool allowed - whether mining of this type is allowed
- uint256 slot - the slot number of this type
- uint256 minDurationBonus - minimum duration bonus in percent
- uint256 maxDurationBonus - maximum bonus duration in percents
- uint256 minRewardBonus - minimum reward bonus in ether
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
- uint256 startBlock - beginning block
- uint256 endBlock - end block of the steak
- uint256 grvxReward - total steak reward in GRVX (wei)
- uint256 minScrap - minimum possible amount of metal
- uint256 maxScrap - maximum possible amount of metal
- uint256 veteranTypeId - the type of veteran being awarded
- bool both - true if there is a captain in the steak, false otherwise
- bool claimed - true if the award is already taken, false otherwise

### Stakes Extra

Returns additional information about the steak by its ID

``jsx
stakesExtra(uint256 stakeId) returns (StakeExtra)
```

**Parameters**

- uint256 stakeId - steak ID

**Return**

- address shipContract - ship contract address
- uint256 shipTypeId - type of ship sent
- address captainContract - captains contract address
- uint256 captainTypeId - type of captain sent
- uint256 scrapQuantity - amount of metal received
- uint256 veteranId - ID of the received veteran
- uint256 voucherId - ID of voucher received
- uint256 skinId - ID of the skin in the steak (MAX_UINT_256 if there is no skin)

### Staked Equipment Type Ids

Returns by the ID of the steak a list of contracts and types of equipment that was in the steak

``jsx
stakedEquipment(uint256 stakeId) returns (address[], uint256[])
```

**Parameters**.

- uint256 stakeId - steak ID

**Return**.

List of equipment contracts and list of equipment types on these contracts

### Stakes Of

Returns a list of the user's steaks

``jsx
function stakesOf(
    address account
) external view returns (
    Stake[] memory accountStakes, StakeExtra[] memory accountStakesExtra
)
```

**Parameters**

- address account - user address

**Return**

- Stake[] accountStakes - list of Stake objects (basic information about stakes, see stakes)
- StakeExtra[] accountStakesExtra - list of StakeExtra objects (additional information about stakes, see stakesExtra)

## Referral Storage Functions Docs

### Constructor

``jsx
initialize(Reward[] memory rewards_, uint256[] memory levelInvitees_)
```

**Parameters**

- Reward[] memory rewards\_ - array with the list of rewards by level
- uint256[] memory levelInvitees\_ - array with the list of invitees by levels

**Reward** - object which includes the following fields:

- tokenType - 0 if ERC20, 1 if ERC721
- token - the contract address of the issued token
- typeId - token type for ERC721 (any number for ERC20)
- amount - number of issued tokens

### Claim Reward

This method is used to get a reward once you have enough invitees

``jsx
function claimReward(uint256 level)
```

**Parameters**

- uint256 level - level at which the reward is given

### Set Program

This method allows the owner of the contract to activate or deactivate another referral program (contract)

``jsx
function setProgram(address program, bool enabled)
```

**Parameters**

- address program - address of the contract program
- bool enabled - true to allow the program, false to prohibit

### Set Levels

This method allows the contract holder to set a new list of levels and rewards

``jsx
function setLevels(Reward[] memory rewards_, uint256[] memory levelInvitees_)
```

**Parameters**

- Reward[] memory rewards\_ - array with the list of rewards by levels
- uint256[] memory levelInvitees\_ - array with the list of invitees by levels

**Reward** - object which includes the following fields:

- tokenType - 0 if ERC20, 1 if ERC721
- token - the contract address of the issued token
- typeId - token type for ERC721 (any number for ERC20)
- amount - number of issued tokens

### Get Invitees Count

This method allows to get the number of invites by address

```
function getInviteesCount(address referrer) external view returns (uint256)
```

**Parameters**

- address referrer - address of the inviter

**Return**

Number of invited addresses

### Get Invitees

This method allows you to get a list of the addresses invited by the address

```
function getInvitees(address referrer) external view returns (address[] memory)
```

**Parameters**

- address referrer - address of the inviter

**Return**.

List of invited addresses
