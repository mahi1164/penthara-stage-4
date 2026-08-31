// Latest rates race cancellation cleanup is broken //Fixed
useEffect(() => {
  let cancelled = false;

  ...

  return () => {
    cancelled = true; // Should be `cancelled = true`
  };
}, [baseCurrency, ratesRetry]);

// Currency search uses non-debounced value  // Now, uses the correct value, Fixed.
const normalizedSearch = debouncedSearchTerm.trim().toLowerCase(); // Should use debouncedSearchTerm

// Converter swap sets both dropdowns to the same currency //Fixed now
<button
  type="button"
  onClick={() => {
    setSourceCurrency(targetCurrency);
    setTargetCurrency(sourceCurrency); // Should swap: setTargetCurrency(sourceCurrency);
  }}
>
  Swap
</button>
