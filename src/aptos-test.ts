import { AccountAddress } from '@aptos-labs/ts-sdk';
import {
  sleep,
  log,
  writeFile,
  aptos,
  sender,
  transferAbi,
  APTOS_COIN_TYPE,
  TOTAL_TX,
} from './utils';

(async () => {
  const results = [];

  for (let i = 0; i < TOTAL_TX; i++) {
    const accountData = await aptos.account.getAccountInfo({
      accountAddress: sender.accountAddress,
    });
    const sequenceNumber = BigInt(accountData.sequence_number);

    const buildStartTime = performance.now();
    const transaction = await aptos.transaction.build.simple({
      sender: sender.accountAddress,
      data: {
        function: '0x1::coin::transfer',
        typeArguments: [APTOS_COIN_TYPE],
        functionArguments: [
          AccountAddress.from(
            '0x6aa2b03c75206aabdac51025d08c691c2e15d946b627e96ddef9f5cfdabc133d'
          ),
          1,
        ],
        abi: transferAbi,
      },
      options: {
        accountSequenceNumber: sequenceNumber,
        maxGasAmount: 1000,
      },
    });
    const gasUnitPriceEstimatation = await aptos.getGasPriceEstimation();
    // @ts-ignore
    transaction.rawTransaction.gas_unit_price =
      gasUnitPriceEstimatation.gas_estimate;

    const startTime = performance.now();

    const committedTransaction = await aptos.signAndSubmitTransaction({
      signer: sender,
      transaction,
    });

    const submitEndTime = performance.now();

    await aptos.waitForTransaction({
      transactionHash: committedTransaction.hash,
    });

    const endTime = performance.now();

    const buildLatency = (startTime - buildStartTime) / 1000;
    const submitLatency = (submitEndTime - startTime) / 1000;
    const latency = (endTime - startTime) / 1000;

    log(`Build latency: ${buildLatency}; E2E latency: ${latency} s`);

    results.push({
      buildLatency,
      submitLatency,
      latency,
    });

    await sleep(2_000);
  }

  const date = new Date().toUTCString();

  const summary = {
    results,
    averageSubmitLatency:
      results.reduce((acc, curr) => acc + curr.submitLatency, 0) /
      results.length,
    averageBuildLatency:
      results.reduce((acc, curr) => acc + curr.buildLatency, 0) /
      results.length,
    averageLatency:
      results.reduce((acc, curr) => acc + curr.latency, 0) / results.length,
    date,
  };

  await writeFile(
    `${__dirname}/../results/aptos-${date}.json`,
    JSON.stringify(summary, null, 2)
  );
})();
