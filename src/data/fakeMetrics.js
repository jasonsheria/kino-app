// Fake metrics for dashboard charts
// Returns metrics for an owner

const metricsByOwner = {
  'owner-123': {
    visits: 128,
    bookings: 24,
    revenue: 3240
  },
  'owner-456': {
    visits: 210,
    bookings: 48,
    revenue: 8200
  }
};

export function getDashboardMetrics(ownerId = 'owner-123'){
  return metricsByOwner[ownerId] || { visits: 0, bookings: 0, revenue: 0 };
}

export default metricsByOwner;
