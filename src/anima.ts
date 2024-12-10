import {
  ANIMA_COSMETIC_TYPE,
  ANIMA_WEAPON_TYPE,
  AVATAR_TYPE,
} from './constants';

import { log, graphQLClient, writeFile } from './utils';

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

  log(result);

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
      owner: pathOr('', ['owner', 'owner', 'address'], node),
      content: pathOr('', ['asMoveObject', 'contents', 'json'], node),
    })),
  };
};

(async () => {
  let after = null;
  let results = [];
  let objects = await getNFTObjects({
    objectType: AVATAR_TYPE,
    after,
    first: 50,
  });

  results.push(...objects.nfts);
  after = objects.pageInfo.endCursor;

  while (after) {
    objects = await getNFTObjects({
      objectType: AVATAR_TYPE,
      after,
      first: 50,
    });

    results.push(...objects.nfts);
    after = objects.pageInfo.endCursor;
  }

  log(results.length);

  await writeFile(
    `${__dirname}/../data/anima-avatars.json`,
    JSON.stringify(results, null, 2)
  );
})();
