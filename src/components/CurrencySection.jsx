import { useEffect, useState } from "react";
import { fetchCurrencies, fetchLatestRates } from "../utils/currencyApi";

function CurrencySection() {
  const [currencies, setCurrencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [rates, setRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");
  const [ratesRetry, setRatesRetry] = useState(0);

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
  let cancelled = false;

  const loadRates = async () => {
    setRatesLoading(true);
    setRatesError("");
    setRates({});

    try {
      const data = await fetchLatestRates(baseCurrency);

      if (cancelled) {
        return;
      }

      setRates(data.rates || {});
    } catch (err) {
      if (cancelled) {
        return;
      }

      setRatesError("Unable to load exchange rates.");
    } finally {
      if (!cancelled) {
        setRatesLoading(false);
      }
    }
  };

  loadRates();

  return () => {
    cancelled = true;
  };
}, [baseCurrency, ratesRetry]);

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

    <div className="currency-controls">
      <label htmlFor="base-currency">
        Base currency
      </label>

      <select
        id="base-currency"
        value={baseCurrency}
        onChange={(event) => setBaseCurrency(event.target.value)}
      >
        {currencyEntries.map(([code, name]) => (
          <option key={code} value={code}>
            {code} — {name}
          </option>
        ))}
      </select>
    </div>

    {ratesLoading ? (
      <p>Loading latest rates...</p>
    ) : ratesError ? (
      <div>
        <p>{ratesError}</p>

        <button
          type="button"
          onClick={() => setRatesRetry((value) => value + 1)}
        >
          Retry
        </button>
      </div>
    ) : Object.keys(rates).length === 0 ? (
      <p>No exchange rates are currently available.</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Currency</th>
            <th>Rate</th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(rates).map(([code, rate]) => (
            <tr key={code}>
              <td>{code}</td>
              <td>{currencies[code] || code}</td>
              <td>{rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </section>
);
}

export default CurrencySection;