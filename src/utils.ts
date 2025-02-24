import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import util from 'util';
import * as fs from 'fs';
import dotenv from 'dotenv';
import invariant from 'tiny-invariant';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

dotenv.config();

invariant(process.env.SUI_PRIVATE_KEY, 'Private key missing');

export const keypair = Ed25519Keypair.fromSecretKey(
  Uint8Array.from(Buffer.from(process.env.SUI_PRIVATE_KEY, 'base64')).slice(1)
);

export const log = (x: any) => console.log(util.inspect(x, false, null, true));

export const suiFullNodeUrl = getFullnodeUrl('mainnet');

export const suiClient = new SuiClient({
  url: suiFullNodeUrl,
});

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const readFile = util.promisify(fs.readFile);

export const writeFile = util.promisify(fs.writeFile);
