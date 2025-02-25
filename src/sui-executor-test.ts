import { keypair, suiClient, log, writeFile, TOTAL_TX } from './utils';
import {
  Transaction,
  SerialTransactionExecutor,
} from '@mysten/sui/transactions';

const COUNTER_CONTRACT_ADDRESS =
  '0xdd4dbcc34a8c05c2367d109119452920cb6776501e10d98bbd1f8ecb5cd97686';
const COUNTER_SHARED_OBJECT = {
  objectId:
    '0x2388b7872b85430d702a453028d4896be8a4acee2ec6b2e41b779fa12a329004',
  initialVersion: '477215908',
  mutable: true,
};

(async () => {
  const gasPrice = await suiClient.getReferenceGasPrice();

  const executor = new SerialTransactionExecutor({
    client: suiClient,
    signer: keypair,
  });

  const txs = [];

  for (let i = 0; i < TOTAL_TX; i++) {
    const tx = new Transaction();
    tx.setSender(keypair.toSuiAddress());
    tx.setGasPrice(Math.floor(Number(gasPrice) * 1.1));

    tx.setGasBudget(5_000_000);

    tx.moveCall({
      target: `${COUNTER_CONTRACT_ADDRESS}::counter::increment`,
      arguments: [
        tx.sharedObjectRef({
          objectId: COUNTER_SHARED_OBJECT.objectId,
          initialSharedVersion: COUNTER_SHARED_OBJECT.initialVersion,
          mutable: COUNTER_SHARED_OBJECT.mutable,
        }),
      ],
    });

    txs.push(tx);
  }

  const startTime = performance.now();

  await Promise.all(txs.map((tx) => executor.executeTransaction(tx)));

  const endTime = performance.now();

  const latency = (endTime - startTime) / 1000;

  const date = new Date().toUTCString();

  const summary = {
    latency: latency / TOTAL_TX,
    date,
  };

  log(summary);

  await writeFile(
    `${__dirname}/../results/sui-executor-${date}.json`,
    JSON.stringify(summary, null, 2)
  );
})();
