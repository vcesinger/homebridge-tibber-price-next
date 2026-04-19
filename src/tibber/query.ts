import { TibberPriceResolution } from '../config/types';

export const PRICE_QUERY = `
  query GetPriceInfo($resolution: PriceRateUnit!) {
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

export function buildVariables(resolution: TibberPriceResolution): Record<string, string> {
  return {
    resolution,
  };
}
