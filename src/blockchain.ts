import { Logger } from '@tehcn/log4js';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { Address } from './types';
import { Colors } from './colors';
import { ec as EC } from 'elliptic';


const logger = new Logger('Block Chain', 'info');
const ec = new EC('secp256k1');

class Transaction {
    public from: Address | null;
    public to: Address;
    public amount: number;
    public signature = '';
    public timestamp: number;

    constructor(from: Address | null, to: Address, amount: number) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    calculateHash(): string {
        return crypto.createHash('SHA256')
            .update(this.from + this.to + this.amount + this.timestamp)
            .digest('hex');
    }

    signTransaction(signingKey: EC.KeyPair) {
        if(signingKey.getPublic('hex') !== this.from){
            logger.error('You cannot sign transactions for other wallets');
            throw new Error();
        }


        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        if(this.from === null) {
            chainValidatorLogger.log('mining reward');
            return true;
        }

        if(!this.signature || this.signature.length === 0) {
            chainValidatorLogger.error('No signature in this transaction');
            throw new Error();
        }
        
        const publicKey = ec.keyFromPublic(this.from, 'hex');
        const verified = publicKey.verify(this.calculateHash(), this.signature);
        return verified;
    }
}

const minerLogger = new Logger('Miner');

class Block {
    public timestamp: number;
    public transactions: Transaction[];
    public previousHash: string;
    public hash: string;
    public nonce: number;

    constructor(timestamp: number, transactions: Transaction[], previousHash: string = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash(): string {
        return crypto.createHash('SHA256')
            .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
            .end()
            .digest('hex');
    }

    mine(difficulty: number) {
        minerLogger.log(`${Colors.CYAN} ⛏  Mining block with difficulty ${difficulty}`);

        const start = performance.now();

        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        const end = performance.now();
        const delta = end - start;
        minerLogger.log(`${Colors.GREEN} ✔  Block mined with hash ${this.hash}${Colors.RESET} ${Colors.BLUE}(took ${delta}ms)${Colors.RESET}\n`);
    }

    hasValidTransactions() {
        for(const tx of this.transactions)
            if(!tx.isValid()) return false;
        return true;
    }
}

const chainValidatorLogger = new Logger('Chain Validator', 'debug');

class BlockChain {
    public chain: Block[];
    public pendingTransactions: Transaction[];
    public miningReward = 100;
    public difficulty = 2;

    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
    }

    createGenesisBlock(): Block {
        return new Block(new Date(1970, 0, 1, 0, 0, 0, 0).getTime(), [], '0');
    }

    get lastestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    // addBlock(newBlock: Block) {
    //     newBlock.previousHash = this.lastestBlock.hash;
    //     newBlock.mine(this.difficulty)
    //     this.chain.push(newBlock);
    // }

    minePendingTransactions(miningRewardAddress: Address) {
        const block = new Block(Date.now(), this.pendingTransactions, this.lastestBlock.hash);
        block.mine(this.difficulty);

        logger.log(` ${Colors.GREEN}✔${Colors.RESET}  Block processed successfully\n`);
        this.chain.push(block);

        this.pendingTransactions = [new Transaction(null, miningRewardAddress, this.miningReward)];
    }

    addTransaction(transaction: Transaction) {

        if((!transaction.from && transaction.from !== null) || !transaction.to) {
            logger.error('Transaction must include from and to adress');
            throw new Error();
        }
        
        if(!transaction.isValid()) {
            logger.error('Cannot add invalid transaction to the chain');
            throw new Error();
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address: Address) {
        let balance = 0;
        for(const block of this.chain) {
            for(const transaction of block.transactions) {
                if(transaction.from === address) 
                    balance -= transaction.amount;
                if(transaction.to === address)
                    balance += transaction.amount;
            }
        }

        return balance;
    }

    isChainValid(): boolean {
        for(let i=1;i<this.chain.length;i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            
            if(!currentBlock.hasValidTransactions()) {
                chainValidatorLogger.warn('has invalid transactions');
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash()) {
                chainValidatorLogger.warn('currentBlock.hash !== currentBlock.calculateHash()');
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.hash) {
                chainValidatorLogger.debug(`stuff\n\tcurrent: ${JSON.stringify(currentBlock, null, 4)}\n\tprevious: ${JSON.stringify(previousBlock, null, 4)}`);
                chainValidatorLogger.warn('currentBlock.previousHash !== previousBlock.hash')
                return false;
            }

        }

        return true;
    }

    get numPendingTransactions(): number {
        return this.pendingTransactions.length;
    }
}

export { Transaction, Block, BlockChain };