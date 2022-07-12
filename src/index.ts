import { Logger } from '@tehcn/log4js';
import { Transaction, BlockChain } from './blockchain';
import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('0a63e9344ecf6b5576f31af410ce95d38a4c726330afdb5c42226f5aa35f2db3');
const myWalletAddress = myKey.getPublic('hex');

const logger = new Logger('Main', 'info');

class JuiceBoxCoin {
    public static blockChain = new BlockChain();

    toString() {
        return JSON.stringify(JuiceBoxCoin.blockChain, null, 4);
    }
}

JuiceBoxCoin.blockChain.minePendingTransactions(myWalletAddress);

const tx1 = new Transaction(myWalletAddress, 'address2', 100);
tx1.signTransaction(myKey);
JuiceBoxCoin.blockChain.addTransaction(tx1);

const tx2 = new Transaction(myWalletAddress, 'address1', 10);
tx2.signTransaction(myKey);
JuiceBoxCoin.blockChain.addTransaction(tx2);

logger.log(`     Pending transactions: ${JuiceBoxCoin.blockChain.numPendingTransactions}\n`);

JuiceBoxCoin.blockChain.minePendingTransactions(myWalletAddress);
logger.log(`⚪  My balance is ${JuiceBoxCoin.blockChain.getBalanceOfAddress(myWalletAddress)}\n`);

JuiceBoxCoin.blockChain.minePendingTransactions(myWalletAddress);
logger.log(`⚪  My balance is ${JuiceBoxCoin.blockChain.getBalanceOfAddress(myWalletAddress)}\n`);


logger.debug(`Is chain valid? ${JuiceBoxCoin.blockChain.isChainValid()}`);