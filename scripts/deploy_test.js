//
// [DEPLOY=1] npm run deploy bsc-testnet
//
const hre = require('hardhat');
require('./utils/logger');
const { die, delay, chkErrors, checkSync, chkDeploy, sendTx, pretyEntry, pretyEvent } = require('./utils/helpers');
const { MaxUint256, AddressZero } = ethers.constants;

const cfg = hre.network.config;
const MINING = cfg.mining || die('mining');

// const REFERRAL_STORAGE = cfg.referral_storage || ethers.constants.AddressZero;
const GRVX = cfg.grvx || die('grvx');
const SCRAP = cfg.scrap || die('scrap');
// const VOUCHERS = cfg.vouchers || die('vouchers');
// const VETERANS = cfg.veterans || die('veterans');
// const SKINS = cfg.skins || die('skins');

const SHIPS = cfg.ships || die('ships');
const CAPTAINS = cfg.captains || die('captains');
const EQUIPMENT = cfg.equipment || die('equipment');

let shipId = 0;
const SHIP_TYPE = 2;
let captainId = 0;
const CAPTAIN_TYPE = 1;
let equipmentId = 0;
const EQUIPMENT_TYPE = 1;

const VETERAN_TYPE = 1;

const INITIAL_STAKE_ID = 100000;

const _sec = 1000;
const _min = 60 * _sec;
const _hour = 60 * _min;


async function main() {
  console.log('Provider:', cfg.url);
  console.log('Network name:', hre.network.name);
  const { number, timestamp } = await ethers.provider.getBlock();
  console.log('Current rpc block:', { number, timestamp });

  /*const tx = await ethers.provider.getTransaction('0x00a659ec86bbaee4b3ec04f9c78c4aba51aac2d2e327238e77641762160ee48b');
  return console.log(tx, {
    gasPrice: tx.gasPrice && tx.gasPrice.toString(),
    gasLimit: tx.gasLimit && tx.gasLimit.toString(),
  });*/

  chkErrors();
  checkSync();

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    console.crit('Deployer account not set.')
    return;
  }

  console.log('Deployer:', deployer.address);
  console.log('Initial balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());

  console.log('Mining contract', 'MiningRandomConsumer');
  const Mining = await ethers.getContractFactory('MiningRandomConsumer');
  const mining = await Mining.attach(MINING);
  console.log('Mining exist at', MINING);
  // console.log('Mining INITIAL_STAKE_ID', await mining.INITIAL_STAKE_ID());

  console.log('shipTypeInfo:', { SHIPS, SHIP_TYPE }, pretyEntry(await mining.shipTypeInfo(SHIPS, SHIP_TYPE)));
  console.log('captainTypeInfo:', { CAPTAINS, CAPTAIN_TYPE }, pretyEntry(await mining.captainTypeInfo(CAPTAINS, CAPTAIN_TYPE)));
  console.log('equipmentTypeInfo:', { EQUIPMENT, EQUIPMENT_TYPE }, pretyEntry(await mining.equipmentTypeInfo(EQUIPMENT, EQUIPMENT_TYPE)));

  const account = deployer.address;
  console.log('stakesOf:', account, await stakesOf(mining, account));

  chkDeploy();

  if (cfg.init) {
    {
      const ERC20 = await ethers.getContractFactory("MintableToken");
      // TODO: check minter role
      const grvx = await ERC20.attach(GRVX);
      console.log('GRVX exist at', GRVX);
      await sendTx('GRVX set minter', grvx.grantRole, [await grvx.MINTER_ROLE(), MINING]);

      // TODO: check minter role
      const scrap = await ERC20.attach(SCRAP);
      console.log('SCRAP exist at', SCRAP);
      await sendTx('SCRAP set minter', scrap.grantRole, [await scrap.MINTER_ROLE(), MINING]);

      {
        const args = [
          SHIPS, // shipContract
          SHIP_TYPE, // typeId
          ethers.utils.parseUnits('10'), // reward
          100, // stakingDuration
          1, // minScrap
          5, // maxScrap
        ];
        await sendTx('Mining.setShipType', mining.setShipType, args);
      }

      {
        const args = [
          CAPTAINS, // captainContract
          CAPTAIN_TYPE, // typeId
          true, // allowed
          VETERAN_TYPE, // veteranTypeId
        ];
        await sendTx('Mining.setCaptainType', mining.setCaptainType, args);
      }

      {
        const args = [
          EQUIPMENT, // equipmentContract
          EQUIPMENT_TYPE, // typeId
          true, // allowed
          20,  // minDurationBonus
          90,  //maxDurationBonus
          5,    //minRewardBonus
          10,   //maxRewardBonus
        ];
        await sendTx('Mining.setEquipmentType', mining.setEquipmentType, args);
      }
    }
  }

  if (cfg.stake) {
    const ERC721 = await ethers.getContractFactory('MintableTypedNFT');
    const approveNFT = async (title, address, nftType, id) => {
      nft = await ERC721.attach(address);
      console.log(title, 'exist at', address);
      if (!id) {
        const { events } = await sendTx(title + ' mint token', nft.mint, [
          deployer.address,
          nftType,
          1
        ]);
        console.done(title, 'mint token  event', pretyEvent(events[0]));
        id = events[0].args.tokenId || 0;
      }
      await sendTx(title + ' approve token', nft.approve, [MINING, id.toString()]);
      return id;
    }
    shipId = await approveNFT('Ships', SHIPS, SHIP_TYPE, shipId);
    captainId = await approveNFT('Captains', CAPTAINS, CAPTAIN_TYPE, captainId);
    equipmentId = await approveNFT('Equipment', EQUIPMENT, EQUIPMENT_TYPE, equipmentId);
    // equipmentId = await approveNFT('Equipment', EQUIPMENT, EQUIPMENT_TYPE, equipmentId);

    stake_args = [
      SHIPS,         // shipContract
      shipId,        // shipId
      CAPTAINS,      // captainContract
      captainId,     // captainId
      MaxUint256,    // skinId
      [EQUIPMENT],   // equipmentContracts[]
      [equipmentId], // equipmentIds[]
      AddressZero,   // referrer
    ];
    const { events } = await sendTx('Mining stake', mining.stake, stake_args);
    // console.done('Mining stake events', events.map(pretyEvent));

    console.log('stakes:', await stakesOf(mining, deployer.address));
  }

  if (cfg.send) {
    const stakeId = INITIAL_STAKE_ID + cfg.send;
    // console.log('stakes:', await stakesOf(mining, deployer.address));

    await sendTx('Mining send ship', mining.sendShip, [stakeId]);
  }

  if (cfg.claim) {
    const stakeId = INITIAL_STAKE_ID + cfg.claim;
    // console.log('stakes:', await stakesOf(mining, deployer.address));

    const { events } = await sendTx('Mining claim', mining.claim, [stakeId]);
    console.done('Mining claim events', events.map(pretyEvent));
  }

  console.log('Final balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.done('All done!');
}

async function stakesOf(mining, account) {
  const [stakes, stakesExtra] = await mining.stakesOf(account);
  const stakesRes = [];
  for (const i in stakes) {
    const res = pretyEntry(stakes[i]);
    res.extra = pretyEntry(stakesExtra[i]);
    stakesRes.push(res);
  }

  return stakesRes;
}


main()
// .then(() => process.exit(0))
.catch((err) => {
  console.error(err.error || '', err);
  process.exit(1);
});
