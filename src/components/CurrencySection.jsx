// Latest rates race cancellation cleanup is broken
useEffect(() => {
  let cancelled = false;

  ...

  return () => {
    cancelled = false; // Should be `cancelled = true`
  };
}, [baseCurrency, ratesRetry]);

// Currency search uses non-debounced value
const normalizedSearch = searchTerm.trim().toLowerCase(); // Should use debouncedSearchTerm

// Converter swap sets both dropdowns to the same currency
<button
  type="button"
  onClick={() => {
    setSourceCurrency(targetCurrency);
    setTargetCurrency(targetCurrency); // Should swap: setTargetCurrency(sourceCurrency);
  }}
>
  Swap
</button>