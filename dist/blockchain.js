"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockChain = exports.Block = exports.Transaction = void 0;
const log4js_1 = require("@tehcn/log4js");
const crypto = __importStar(require("crypto"));
const perf_hooks_1 = require("perf_hooks");
const colors_1 = require("./colors");
const elliptic_1 = require("elliptic");
const logger = new log4js_1.Logger('Block Chain', 'info');
const ec = new elliptic_1.ec('secp256k1');
class Transaction {
    constructor(from, to, amount) {
        this.signature = '';
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.timestamp = Date.now();
    }
    calculateHash() {
        return crypto.createHash('SHA256')
            .update(this.from + this.to + this.amount + this.timestamp)
            .digest('hex');
    }
    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.from) {
            logger.error('You cannot sign transactions for other wallets');
            throw new Error();
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }
    isValid() {
        if (this.from === null) {
            chainValidatorLogger.log('mining reward');
            return true;
        }
        if (!this.signature || this.signature.length === 0) {
            chainValidatorLogger.error('No signature in this transaction');
            throw new Error();
        }
        const publicKey = ec.keyFromPublic(this.from, 'hex');
        const verified = publicKey.verify(this.calculateHash(), this.signature);
        return verified;
    }
}
exports.Transaction = Transaction;
const minerLogger = new log4js_1.Logger('Miner');
class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }
    calculateHash() {
        return crypto.createHash('SHA256')
            .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
            .end()
            .digest('hex');
    }
    mine(difficulty) {
        minerLogger.log(`${colors_1.Colors.CYAN} ⛏  Mining block with difficulty ${difficulty}`);
        const start = perf_hooks_1.performance.now();
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        const end = perf_hooks_1.performance.now();
        const delta = end - start;
        minerLogger.log(`${colors_1.Colors.GREEN} ✔  Block mined with hash ${this.hash}${colors_1.Colors.RESET} ${colors_1.Colors.BLUE}(took ${delta}ms)${colors_1.Colors.RESET}\n`);
    }
    hasValidTransactions() {
        for (const tx of this.transactions)
            if (!tx.isValid())
                return false;
        return true;
    }
}
exports.Block = Block;
const chainValidatorLogger = new log4js_1.Logger('Chain Validator', 'debug');
class BlockChain {
    constructor() {
        this.miningReward = 100;
        this.difficulty = 2;
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
    }
    createGenesisBlock() {
        return new Block(new Date(1970, 0, 1, 0, 0, 0, 0).getTime(), [], '0');
    }
    get lastestBlock() {
        return this.chain[this.chain.length - 1];
    }
    // addBlock(newBlock: Block) {
    //     newBlock.previousHash = this.lastestBlock.hash;
    //     newBlock.mine(this.difficulty)
    //     this.chain.push(newBlock);
    // }
    minePendingTransactions(miningRewardAddress) {
        const block = new Block(Date.now(), this.pendingTransactions, BlockChain.INSTANCE.lastestBlock.hash);
        block.mine(this.difficulty);
        logger.log(` ${colors_1.Colors.GREEN}✔${colors_1.Colors.RESET}  Block processed successfully\n`);
        this.chain.push(block);
        this.pendingTransactions = [new Transaction(null, miningRewardAddress, this.miningReward)];
    }
    addTransaction(transaction) {
        if ((!transaction.from && transaction.from !== null) || !transaction.to) {
            logger.error('Transaction must include from and to adress');
            throw new Error();
        }
        if (!transaction.isValid()) {
            logger.error('Cannot add invalid transaction to the chain');
            throw new Error();
        }
        this.pendingTransactions.push(transaction);
    }
    getBalanceOfAddress(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.from === address)
                    balance -= transaction.amount;
                if (transaction.to === address)
                    balance += transaction.amount;
            }
        }
        return balance;
    }
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            if (!currentBlock.hasValidTransactions()) {
                chainValidatorLogger.warn('has invalid transactions');
                return false;
            }
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                chainValidatorLogger.warn('currentBlock.hash !== currentBlock.calculateHash()');
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                chainValidatorLogger.debug(`stuff\n\tcurrent: ${JSON.stringify(currentBlock, null, 4)}\n\tprevious: ${JSON.stringify(previousBlock, null, 4)}`);
                chainValidatorLogger.warn('currentBlock.previousHash !== previousBlock.hash');
                return false;
            }
        }
        return true;
    }
    get numPendingTransactions() {
        return this.pendingTransactions.length;
    }
}
exports.BlockChain = BlockChain;
BlockChain.INSTANCE = new BlockChain();
