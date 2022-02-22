require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('solidity-coverage');
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

task('accounts', 'Prints the list of accounts', async (args, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

const envVal = (key, def, type = 'string') => {
    const val = process.env[key];
    if (typeof val == 'undefined') return def;

    if (type == 'list') return val.split(',');

    if (type == 'num') return isNaN(val) ? def : +val;

    if (type == 'bool') {
        if (['false', '0'].includes(val)) return false;
        return !!val;
    }

    return val;
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        version: '0.8.9',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            }
        }
    },
    etherscan: {
        apiKey: process.env.SCAN_API,
    },
    defaultNetwork: 'env',
    networks: {
        'env': {
            url: envVal('RPC_URL', 'RPC NOT SETTED'),
            accounts: envVal('PRIVATE_KEYS', [], 'list'),

            mining: envVal('MINING'),
            coordinator: envVal('COORDINATOR'),

            referral_storage: envVal('REFERRAL_STORAGE'),

            grvx: envVal('GRVX'),
            scrap: envVal('SCRAP'),
            veterans: envVal('VETERANS'),
            skins: envVal('SKINS'),
            vouchers: envVal('VOUCHERS'),

            ships: envVal('SHIPS'),
            captains: envVal('CAPTAINS'),
            equipment: envVal('EQUIPMENT'),

            stake: envVal('STAKE', 0, 'num'),
            send: envVal('SEND', 0, 'num'),
            claim: envVal('CLAIM', 0, 'num'),
            init: envVal('INIT', false, 'bool'),
        },
        'bsc-testnet': {
            url: envVal('RPC_URL', 'https://data-seed-prebsc-1-s1.binance.org:8545/'),
            accounts: envVal('PRIVATE_KEYS', [], 'list'),

            mining: envVal('MINING'),
            coordinator: envVal('COORDINATOR', ''),

            referral_storage: envVal('REFERRAL_STORAGE'),

            grvx: envVal('GRVX'),
            scrap: envVal('SCRAP'),
            veterans: envVal('VETERANS'),
            skins: envVal('SKINS'),
            vouchers: envVal('VOUCHERS'),

            ships: envVal('SHIPS'),
            captains: envVal('CAPTAINS'),
            equipment: envVal('EQUIPMENT'),

            stake: envVal('STAKE', 0, 'num'),
            send: envVal('SEND', 0, 'num'),
            claim: envVal('CLAIM', 0, 'num'),
            init: envVal('INIT', false, 'bool'),
        },
        'matic-testnet': {
            url: envVal('RPC_URL', 'https://matic-mumbai.chainstacklabs.com'),
            accounts: envVal('PRIVATE_KEYS', [], 'list'),

            mining: envVal('MINING'),
            coordinator: envVal('COORDINATOR', ''),

            referral_storage: envVal('REFERRAL_STORAGE'),

            grvx: envVal('GRVX'),
            scrap: envVal('SCRAP'),
            veterans: envVal('VETERANS'),
            skins: envVal('SKINS'),
            vouchers: envVal('VOUCHERS'),

            ships: envVal('SHIPS'),
            captains: envVal('CAPTAINS'),
            equipment: envVal('EQUIPMENT'),

            stake: envVal('STAKE', 0, 'num'),
            send: envVal('SEND', 0, 'num'),
            claim: envVal('CLAIM', 0, 'num'),
            init: envVal('INIT', false, 'bool'),
        },
        'matic-mainnet': {
            url: envVal('RPC_URL', 'https://rpc-mainnet.matic.quiknode.pro'),
            accounts: envVal('PRIVATE_KEYS', [], 'list'),

            mining: envVal('MINING'),
            coordinator: envVal('COORDINATOR', ''),

            referral_storage: envVal('REFERRAL_STORAGE'),

            grvx: envVal('GRVX'),
            scrap: envVal('SCRAP'),
            veterans: envVal('VETERANS'),
            skins: envVal('SKINS'),
            vouchers: envVal('VOUCHERS'),

            ships: envVal('SHIPS'),
            captains: envVal('CAPTAINS'),
            equipment: envVal('EQUIPMENT'),

            stake: envVal('STAKE', 0, 'num'),
            send: envVal('SEND', 0, 'num'),
            claim: envVal('CLAIM', 0, 'num'),
            init: envVal('INIT', false, 'bool'),
        },
        'bsc-mainnet': {
            url: envVal('RPC_URL', 'https://bsc-dataseed.binance.org'),
            accounts: envVal('PRIVATE_KEYS', [], 'list'),

            mining: envVal('MINING'),
            coordinator: envVal('COORDINATOR', ''),

            referral_storage: envVal('REFERRAL_STORAGE'),

            grvx: envVal('GRVX'),
            scrap: envVal('SCRAP'),
            veterans: envVal('VETERANS'),
            skins: envVal('SKINS'),
            vouchers: envVal('VOUCHERS'),

            ships: envVal('SHIPS'),
            captains: envVal('CAPTAINS'),
            equipment: envVal('EQUIPMENT'),

            stake: envVal('STAKE', 0, 'num'),
            send: envVal('SEND', 0, 'num'),
            claim: envVal('CLAIM', 0, 'num'),
            init: envVal('INIT', false, 'bool'),
        },
    },
};
