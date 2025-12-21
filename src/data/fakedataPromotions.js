
// Promotions utilitaires — extrait et formate les biens marqués `promotion: true`
import { properties, agents, getLocalPromotions as _getLocalPromotions, fetchMorePromotionsFromServer as _fetchMorePromotionsFromServer } from './fakedata';
import fakedataDefault from './fakedata';
const _formatPromo = (fakedataDefault && fakedataDefault.formatPromo) ? fakedataDefault.formatPromo : (p => p);

export function getLocalPromotions(opts = {}) {
	return _getLocalPromotions(opts);
}

export async function fetchMorePromotionsFromServer(opts = {}) {
	return _fetchMorePromotionsFromServer(opts);
}

export function formatPromo(p) {
	return _formatPromo(p);
}

export function getAllLocalFormattedPromotions() {
	try {
		const promos = (properties || []).filter(p => p && (p.promotion === true)).map(_formatPromo).filter(Boolean);
		return promos;
	} catch (e) { return []; }
}

export { properties, agents };

export default {
	getLocalPromotions,
	fetchMorePromotionsFromServer,
	formatPromo,
	getAllLocalFormattedPromotions,
};

