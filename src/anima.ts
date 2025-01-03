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
  const file = await readFile(`${__dirname}/../data/rootlets-owners.json`);
  const rootlets: { id: string; kiosk: string }[] = JSON.parse(file.toString());

  log(rootlets);

  const rootletsMap = rootlets.reduce((acc, r) => {
    if (acc[r.kiosk]) {
      acc[r.kiosk].push(r.id);
    } else {
      acc[r.kiosk] = [r.id];
    }
    return acc;
  }, {} as any);

  const chunks = chunkArray(Object.keys(rootletsMap), 50);

  const results = [];

  for (const owners of chunks) {
    const kiosk = await rpcClient.multiGetObjects({
      ids: owners,
      options: {
        showContent: true,
      },
    });

    results.push(...kiosk);

    await sleep(1000);
  }

  const rootletsWithOwners = results.reduce((acc, r, i) => {
    acc[r.data?.objectId!] = {
      ...rootletsMap[r.data?.objectId!],
      owner: (r.data as any)?.content?.fields?.owner,
    };
    return acc;
  }, {} as any);

  await writeFile(
    `${__dirname}/../data/rootlets-owners.json`,
    JSON.stringify(rootletsWithOwners, null, 2)
  );

  // log(kiosk);

  // const kioskOwner = await rpcClient.getObject({
  //   id: '0xc550892c851457143230fd43acdd3e4cdb816d9cab701ba4cb1f03f0271e9773',
  //   options: {
  //     showContent: true,
  //   },
  // });

  // log(kioskOwner);
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
