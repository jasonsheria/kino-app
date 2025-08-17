// Promotions factices — regroupe tous les biens en promotion
import { properties } from './fakedata';

// For simplicity, mark some existing properties as promoted, and duplicate if needed
const base = properties;

export const promotions = (
  [1,2,3,4,5,6,7,8,9,10,11,12,101,102,103]
).map((pid, idx) => {
  const p = base.find(x => x.id === pid) || base[idx % base.length];
  return {
    promoId: `PROMO-${pid}-${idx}`,
    featured: idx < 8, // some are featured
    discountPercent: [10,15,20,5,25,30][idx % 6],
    validUntil: new Date(Date.now() + (7 + idx) * 24 * 3600 * 1000).toISOString(),
    property: p,
  };
});

export default promotions;
