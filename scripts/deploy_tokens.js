//
// [DEPLOY=1] npm run deploy bsc-testnet
//
const hre = require('hardhat');
require('./utils/logger');
const { die, delay, chkErrors, checkSync, chkDeploy, sendTx } = require('./utils/helpers');

const cfg = hre.network.config;
const MINING = cfg.mining;

const ERC20Contracts = {
  grvx: cfg.grvx,
  scrap: cfg.scrap,
};
const ERC721Contracts = {
  ships: cfg.ships,
  captains: cfg.captains,
  veterans: cfg.veterans,
  equipment: cfg.equipment,
  skins: cfg.skins,
  vouchers: cfg.vouchers,
};

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

  chkDeploy();

  const ERC20 = await ethers.getContractFactory('MintableToken');
  const ERC721 = await ethers.getContractFactory('MintableTypedNFT');

  let ERC20_contracts = {};
  let ERC721_contracts = {};

  for (const key of Object.keys(ERC20Contracts)) {
    let erc20;
    if (ERC20Contracts[key]) {
      erc20 = await ERC20.attach(ERC20Contracts[key]);
      console.done(key, 'ERC20: exist at', erc20.address);
    }
    else {
      console.log(key, 'ERC20: start deploy..');
      const erc20_args = [key, key.toUpperCase()];
      erc20 = await ERC20.deploy(...erc20_args);
      console.done(key, 'ERC20: deployed at', erc20.address);

      hre.run('verify:verify', {
        address: erc20.address,
        constructorArguments: erc20_args,
      })
        .then(() => console.done(key, 'ERC20: verification success'))
        .catch(err => console.warn(key, 'ERC20: verification failed:', err));
    }

    /*if (cfg.mint) {
      await sendTx(key + 'ERC20: mint tokens', erc20.mint, [deployer.address, ethers.utils.parseUnits('100')]);
    }*/

    ERC20_contracts[key] = erc20;
  }

  for (const key of Object.keys(ERC721Contracts)) {
    let nft;
    if (ERC721Contracts[key]) {
      nft = await ERC721.attach(ERC721Contracts[key]);
      console.done(key, 'ERC721: exist at', nft.address);
    }
    else {
      console.log(key, 'ERC721: start deploy..');
      nft = await ERC721.deploy(3);
      console.done(key, 'ERC721: deployed at', nft.address);

      hre.run('verify:verify', {
        address: nft.address,
        constructorArguments: [3],
      })
        .then(() => console.done(key, 'ERC721: verification success'))
        .catch(err => console.warn(key, 'ERC721: verification failed:', err));
    }

    ERC721_contracts[key] = nft;
  }

  /*if (MINING) {
    try {
      await sendTx('skins transfer ownership', ERC721_contracts.skins.transferOwnership, [MINING]);
    }
    catch (err) {
      console.warn('skins transfer ownership', err);
    }

    try {
      await sendTx('veterans transfer ownership', ERC721_contracts.veterans.transferOwnership, [MINING]);
    }
    catch (err) {
      console.warn('veterans transfer ownership', err);
    }
  }*/

  console.log('Final balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());
  await delay(5000);
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
