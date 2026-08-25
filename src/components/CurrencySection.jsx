import { useEffect, useState } from "react";
import { fetchCurrencies } from "../utils/currencyApi";

function CurrencySection() {
  const [currencies, setCurrencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCurrencies = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchCurrencies();
      setCurrencies(data);
    } catch (err) {
      setError("Unable to load currencies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  if (loading) {
    return (
      <section className="currency-section">
        <h2>Currencies</h2>
        <p>Loading currencies...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="currency-section">
        <h2>Currencies</h2>
        <p>{error}</p>

        <button type="button" onClick={loadCurrencies}>
          Retry
        </button>
      </section>
    );
  }

  const currencyEntries = Object.entries(currencies);

  if (currencyEntries.length === 0) {
    return (
      <section className="currency-section">
        <h2>Currencies</h2>
        <p>No currencies are currently available.</p>
      </section>
    );
  }

  return (
    <section className="currency-section">
      <h2>Currencies</h2>

      <ul>
        {currencyEntries.map(([code, name]) => (
          <li key={code}>
            <strong>{code}</strong> — {name}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CurrencySection;