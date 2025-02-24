import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import util from 'util';
import * as fs from 'fs';
import dotenv from 'dotenv';
import invariant from 'tiny-invariant';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import {
  Account,
  Aptos,
  APTOS_COIN,
  AptosConfig,
  Ed25519PrivateKey,
  parseTypeTag,
  TypeTagAddress,
  TypeTagU64,
  Network,
} from '@aptos-labs/ts-sdk';

dotenv.config();

invariant(process.env.SUI_PRIVATE_KEY, 'Private key missing');
invariant(process.env.APTOS_PRIVATE_KEY, 'Private key missing');
export const keypair = Ed25519Keypair.fromSecretKey(
  Uint8Array.from(Buffer.from(process.env.SUI_PRIVATE_KEY, 'base64')).slice(1)
);

export const log = (x: any) => console.log(util.inspect(x, false, null, true));

export const suiFullNodeUrl = getFullnodeUrl('mainnet');

export const suiClient = new SuiClient({
  url: suiFullNodeUrl,
});

const aptosConfig = new AptosConfig({ network: Network.MAINNET });

export const aptos = new Aptos(aptosConfig);

const APTOS_PRIVATE_KEY = process.env.APTOS_PRIVATE_KEY;

export const sender = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(APTOS_PRIVATE_KEY),
});

export const transferAbi = {
  typeParameters: [{ constraints: [] }],
  parameters: [new TypeTagAddress(), new TypeTagU64()],
};

export const APTOS_COIN_TYPE = parseTypeTag(APTOS_COIN);

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const readFile = util.promisify(fs.readFile);

export const writeFile = util.promisify(fs.writeFile);

export const TOTAL_TX = 20;
