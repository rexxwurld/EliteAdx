const PLATFORM_FEE_RATE = 0.15; // 15% platform cut, adjust as needed

function calculateCTR(clicks, impressions) {
  if (!impressions) return 0;
  return Number(((clicks / impressions) * 100).toFixed(2));
}

function calculatePlatformProfit(totalSpent) {
  return Number((totalSpent * PLATFORM_FEE_RATE).toFixed(2));
}

function calculatePublisherEarnings(totalSpent) {
  return Number((totalSpent * (1 - PLATFORM_FEE_RATE)).toFixed(2));
}

module.exports = {
  PLATFORM_FEE_RATE,
  calculateCTR,
  calculatePlatformProfit,
  calculatePublisherEarnings,
};
