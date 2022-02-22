//
// [DEPLOY=1] npm run deploy bsc-testnet
//
const hre = require('hardhat');
require('./utils/logger');
const { die, delay, chkErrors, checkSync, chkDeploy, sendTx } = require('./utils/helpers');
const { MaxUint256 } = ethers.constants;

const cfg = hre.network.config;
const MINING = cfg.mining;
const COORDINATOR = cfg.coordinator || die('coordinator');

const REFERRAL_STORAGE = cfg.referral_storage || ethers.constants.AddressZero;
const GRVX = cfg.grvx || die('grvx');
const SCRAP = cfg.scrap || die('scrap');
const VOUCHERS = cfg.vouchers || die('vouchers');
const VETERANS = cfg.veterans || die('veterans');
const SKINS = cfg.skins || '0xffffffffffffffffffffffffffffffffffffffff';//MaxUint256;

// const SHIPS = cfg.ships || die('ships');
// const CAPTAINS = cfg.captains || die('captains');
// const EQUIPMENT = cfg.equipment || die('equipment');

async function main() {
  console.log('Provider:', cfg.url);
  console.log('Network name:', hre.network.name);

  chkErrors();
  checkSync();

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    console.crit('Deployer account not set.')
    return;
  }

  console.log('Deployer:', deployer.address);
  console.log('Initial balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());

  console.log('Coordinator contract address:', COORDINATOR);
  console.log('Grvx contract address:', GRVX);
  console.log('Scrap contract address:', SCRAP);
  console.log('Vouchers contract address:', VOUCHERS);
  console.log('Veterans contract address:', VETERANS);
  console.log('Skins contract address:', SKINS);
  console.log('Referral storage contract address:', REFERRAL_STORAGE);

  // console.log('Ships contract address:', SHIPS);
  // console.log('Captains contract address:', CAPTAINS);
  // console.log('Equipment contract address:', EQUIPMENT);

  console.log('Mining contract', 'MiningRandomConsumer');

  chkDeploy();

  Mining = await ethers.getContractFactory('MiningRandomConsumer');
  const mining_args = [
    // COORDINATOR,
    GRVX,
    VOUCHERS,
    SCRAP,
    VETERANS,
    SKINS,
    REFERRAL_STORAGE,
  ];

  let mining;
  if (MINING) {
    mining = await Mining.attach(MINING);
    console.done('Mining exist at', mining.address);
  }
  else {
    console.log('start deploy', mining_args);
    mining = await hre.upgrades.deployProxy(Mining, mining_args);
    await mining.deployed();
    console.done('Mining (proxy) deployed at', mining.address);
  }

  const proxyAdmin = await upgrades.admin.getInstance();
  console.done('proxyAdmin', proxyAdmin.address);
  const impl = await proxyAdmin.getProxyImplementation(mining.address);
  console.done('ProxyImplementation', impl);

  await sendTx('set coordinator', mining.setCoordinator, [COORDINATOR]);

  console.log('Final balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());

  /*try {
    await delay(1000);
    await hre.run('verify:verify', {
      address: impl,
      constructorArguments: mining_args,
    });
    console.done('Verification success');
  }
  catch (err) {
    console.warn('Crafting verification failed:', err);
  }*/

  console.done('All done!');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch((err) => {
  console.error(err.error || '', err);
  process.exit(1);
});
