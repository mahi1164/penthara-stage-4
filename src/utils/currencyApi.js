const API_BASE_URL = "https://api.frankfurter.dev";

export async function fetchCurrencies() {
  const response = await fetch(`${API_BASE_URL}/v1/currencies`);

  if (!response.ok) {
    throw new Error("Failed to fetch currencies.");
  }

  return response.json();
}