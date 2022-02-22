//
// [DEPLOY=1] npm run deploy bsc-testnet
//
const hre = require('hardhat');
require('./utils/logger');
const { die, delay, chkErrors, checkSync, chkDeploy } = require('./utils/helpers');

const cfg = hre.network.config;
const MINING = cfg.mining || die('mining');
// const COORDINATOR = cfg.coordinator || die('coordinator');

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

  console.log('Mining exist at', MINING);
  // console.log('Coordinator contract address:', COORDINATOR);

  chkDeploy();

  console.log('start upgrade');
  Mining = await ethers.getContractFactory('MiningRandomConsumer');
  const tx = await hre.upgrades.upgradeProxy(MINING, Mining);
  console.done('Mining (proxy) upgraded', tx.deployTransaction.hash);

  const proxyAdmin = await upgrades.admin.getInstance();
  console.done('proxyAdmin', proxyAdmin.address);
  const impl = await proxyAdmin.getProxyImplementation(MINING);
  console.done('ProxyImplementation', impl);

  /*console.log('set coordinator..');
  const tx = await mining.setCoordinator(COORDINATOR);
  console.done('coordinator setted at', tx.hash);
  await tx.wait();
  console.done('set coordinator done');*/

  console.log('Final balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());

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
