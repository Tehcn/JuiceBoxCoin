"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js_1 = require("@tehcn/log4js");
const blockchain_1 = require("./blockchain");
const elliptic_1 = require("elliptic");
const ec = new elliptic_1.ec('secp256k1');
const myKey = ec.keyFromPrivate('0a63e9344ecf6b5576f31af410ce95d38a4c726330afdb5c42226f5aa35f2db3');
const myWalletAddress = myKey.getPublic('hex');
const logger = new log4js_1.Logger('Main', 'info');
class JuiceBoxCoin {
    toString() {
        return JSON.stringify(JuiceBoxCoin.blockChain, null, 4);
    }
}
JuiceBoxCoin.blockChain = blockchain_1.BlockChain.INSTANCE;
JuiceBoxCoin.blockChain.minePendingTransactions(myWalletAddress);
const tx1 = new blockchain_1.Transaction(myWalletAddress, 'address2', 100);
tx1.signTransaction(myKey);
JuiceBoxCoin.blockChain.addTransaction(tx1);
const tx2 = new blockchain_1.Transaction(myWalletAddress, 'address1', 10);
tx2.signTransaction(myKey);
JuiceBoxCoin.blockChain.addTransaction(tx2);
logger.log(`     Pending transactions: ${JuiceBoxCoin.blockChain.numPendingTransactions}\n`);
JuiceBoxCoin.blockChain.minePendingTransactions(myWalletAddress);
logger.log(`⚪  My balance is ${JuiceBoxCoin.blockChain.getBalanceOfAddress(myWalletAddress)}\n`);
JuiceBoxCoin.blockChain.minePendingTransactions(myWalletAddress);
logger.log(`⚪  My balance is ${JuiceBoxCoin.blockChain.getBalanceOfAddress(myWalletAddress)}\n`);
logger.debug(`Is chain valid? ${JuiceBoxCoin.blockChain.isChainValid()}`);
