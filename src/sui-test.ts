import { keypair, sleep, suiClient, log, writeFile, TOTAL_TX } from './utils';
import { Transaction } from '@mysten/sui/transactions';

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

  const results = [];

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

    const buildStartTime = performance.now();
    const bytes = await tx.build({ client: suiClient });

    const startTime = performance.now();

    await suiClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: bytes,
    });

    const endTime = performance.now();

    const buildLatency = (startTime - buildStartTime) / 1000;
    const latency = (endTime - startTime) / 1000;

    log(`Build latency: ${buildLatency}; E2E latency: ${latency} s`);

    results.push({
      buildLatency,
      latency,
    });

    await sleep(2_000);
  }

  const date = new Date().toUTCString();

  const summary = {
    results,
    averageBuildLatency:
      results.reduce((acc, curr) => acc + curr.buildLatency, 0) /
      results.length,
    averageLatency:
      results.reduce((acc, curr) => acc + curr.latency, 0) / results.length,
    date,
  };

  await writeFile(
    `${__dirname}/../results/sui-${date}.json`,
    JSON.stringify(summary, null, 2)
  );
})();
