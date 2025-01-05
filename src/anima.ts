import {
  ANIMA_COSMETIC_TYPE,
  ANIMA_WEAPON_TYPE,
  AVATAR_TYPE,
} from './constants';
import { chunkArray } from '@polymedia/suitcase-core';
import {
  log,
  graphQLClient,
  writeFile,
  readFile,
  rpcClient,
  sleep,
} from './utils';
import { Transaction } from '@mysten/sui/transactions';

import { queryNFTObjects } from './query';
import { pathOr } from 'ramda';

interface GetNFTObjectsArgs {
  objectType: string;
  after: string | null;
  first: number;
}

export const getNFTObjects = async ({
  objectType,
  after,
  first,
}: GetNFTObjectsArgs) => {
  const result = await graphQLClient.query({
    query: queryNFTObjects,
    variables: { type: objectType, first, after },
  });

  return {
    pageInfo: {
      endCursor: pathOr(
        '',
        ['data', 'objects', 'pageInfo', 'endCursor'],
        result
      ),
      hasNextPage: pathOr(
        false,
        ['data', 'objects', 'pageInfo', 'hasNextPage'],
        result
      ),
    },
    nfts: pathOr([], ['data', 'objects', 'nodes'], result).map((node) => ({
      owner: pathOr('', ['owner', 'parent', 'address'], node),
      id: pathOr('', ['asMoveObject', 'contents', 'json', 'id'], node),
    })),
  };
};

(async () => {
  const rootletId =
    '0xefe734942dc74e220761655eee40571276387390f65449c5980dbe17005c3c56';

  const kioskId =
    '0xe01abdd6046ffe32058fea11e3ca6944271c5ae0da8cd633c6e2d8cd5a4babd4';

  const rootletType =
    '0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet';

  const rootletImgId =
    '0xfdb524be4a187112299445024a25fbc799e9499fc55ecbc878d3345e82468f12';

  const packageId =
    '0xbe7741c72669f1552d0912a4bc5cdadb5856bcb970350613df9b4362e4855dc5';

  const saleV2 =
    '0x2ce5c11867a713bcd0a60620bb15964769f10bbeb86133a271cffcae404ab32e';

  const rootletOwner =
    '0x4182d1e45353a76b862da8c4aa601fa105de02e92459cce30bc9170123130251';

  const PERSONAL_KIOSK_PACKAGE =
    '0x0cb4bcc0560340eb1a1b929cabe56b33fc6449820ec8c1980d69bb98b649b802';

  const personalCapId =
    '0x55021c50b82bd1b75239555d990fc82d5e99b8b494284eb1723701fc95e1502e';

  const tx = new Transaction();

  const [kioskOwnerCap, perosnalBorrow] = tx.moveCall({
    target: `${PERSONAL_KIOSK_PACKAGE}::personal_kiosk::borrow_val`,
    arguments: [tx.object(personalCapId)],
  });

  const [nft, nftBorrow] = tx.moveCall({
    target: `0x2::kiosk::borrow_val`,
    arguments: [tx.object(kioskId), kioskOwnerCap, tx.pure.id(rootletId)],
    typeArguments: [rootletType],
  });

  tx.moveCall({
    target: `${packageId}::rootlet::reveal_v2`,
    arguments: [nft, tx.object(saleV2), tx.object(rootletImgId)],
  });

  tx.moveCall({
    target: `0x2::kiosk::return_val`,
    arguments: [tx.object(kioskId), nft, nftBorrow],
    typeArguments: [rootletType],
  });

  tx.moveCall({
    target: `${PERSONAL_KIOSK_PACKAGE}::personal_kiosk::return_val`,
    arguments: [tx.object(personalCapId), kioskOwnerCap, perosnalBorrow],
  });

  console.log(
    await rpcClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: rootletOwner,
    })
  );
})();

// (async () => {
//   let after = null;
//   let results = [];
//   let objects = await getNFTObjects({
//     objectType:
//       '0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet',
//     after,
//     first: 50,
//   });

//   results.push(...objects.nfts);
//   after = objects.pageInfo.endCursor;

//   while (after) {
//     objects = await getNFTObjects({
//       objectType:
//         '0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet',
//       after,
//       first: 50,
//     });

//     results.push(...objects.nfts);
//     after = objects.pageInfo.endCursor;
//   }

//   log(results.length);

//   await writeFile(
//     `${__dirname}/../data/rootlets-field-ids.json`,
//     JSON.stringify(results, null, 2)
//   );
// })();
