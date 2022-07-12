import { ec as EC } from 'elliptic';
import { Logger } from '@tehcn/log4js';

const ec = new EC('secp256k1');
const logger = new Logger('Key Generator');

const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privateKey = key.getPrivate('hex');

logger.log(`\n\tPrivate key: ${privateKey}\n\tPublic key: ${publicKey}`);