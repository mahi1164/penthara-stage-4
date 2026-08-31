export function calculatePercentageChange(todayRate, historicalRate) {
  if (
    typeof todayRate !== "number" ||
    typeof historicalRate !== "number" ||
    historicalRate === 0
  ) {
    return null;
  }

  return ((todayRate - historicalRate) / historicalRate) * 100; // Should divide by historicalRate
}
