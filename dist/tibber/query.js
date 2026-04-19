const PRICE_QUERY = `
  query GetPriceInfo($resolution: PriceInfoResolution) {
    viewer {
      homes {
        id
        currentSubscription {
          status
          priceInfo(resolution: $resolution) {
            current {
              total
              energy
              tax
              startsAt
              currency
              level
            }
            today {
              total
              energy
              tax
              startsAt
              currency
              level
            }
            tomorrow {
              total
              energy
              tax
              startsAt
              currency
              level
            }
          }
        }
      }
    }
  }
`;

function buildVariables(resolution) {
  return { resolution };
}

module.exports = {
  PRICE_QUERY,
  buildVariables,
};

