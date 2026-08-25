const API_BASE_URL = "https://api.frankfurter.dev";

export async function fetchCurrencies() {
  const response = await fetch(`${API_BASE_URL}/v1/currencies`);

  if (!response.ok) {
    throw new Error("Failed to fetch currencies.");
  }

  return response.json();
}

export async function fetchLatestRates(baseCurrency) {
  const response = await fetch(
    `${API_BASE_URL}/v1/latest?base=${encodeURIComponent(baseCurrency)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch exchange rates.");
  }

  return response.json();
}

export async function fetchHistoricalRate(baseCurrency, date, currency) {
  const response = await fetch(
    `${API_BASE_URL}/v1/${date}?base=${encodeURIComponent(
      baseCurrency
    )}&symbols=${encodeURIComponent(currency)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch historical exchange rate.");
  }

  return response.json();
}
