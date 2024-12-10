export const queryNFTObjects = `query($first: Int!, $after: String, $type: String!) {
  objects(
    first: $first
    after: $after
    filter: {type: $type}
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    nodes {
      owner {
        __typename
        ... on Parent {
          parent {
            address
          }
        }
      }
      asMoveObject {
        contents {
          json
        }
      }
    }
  }
}`;
