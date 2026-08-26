import { useEffect, useState } from "react";
import {
  fetchCurrencies,
  fetchLatestRates,
  fetchHistoricalRate,
} from "../utils/currencyApi";

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date.toISOString().split("T")[0];
}

function CurrencySection() {
  const [currencies, setCurrencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [rates, setRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");
  const [ratesRetry, setRatesRetry] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [amount, setAmount] = useState("1");
  const [sourceCurrency, setSourceCurrency] = useState("USD");
  const [targetCurrency, setTargetCurrency] = useState("EUR");

  const [detailCurrency, setDetailCurrency] = useState("EUR");
  const [historicalRate, setHistoricalRate] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRetry, setDetailRetry] = useState(0);

  // Load supported currencies
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

  // Fetch latest rates whenever the base currency changes
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

  // Debounce search by approximately 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Fetch the rate from 30 days ago
  useEffect(() => {
    let cancelled = false;

    const loadHistoricalRate = async () => {
      if (!detailCurrency) {
        return;
      }

      setDetailLoading(true);
      setDetailError("");
      setHistoricalRate(null);

      // A currency compared against itself is always 1
      if (detailCurrency === baseCurrency) {
        setHistoricalRate(1);
        setDetailLoading(false);
        return;
      }

      try {
        const historicalDate = getDateDaysAgo(30);

        const data = await fetchHistoricalRate(
          baseCurrency,
          historicalDate,
          detailCurrency
        );

        if (cancelled) {
          return;
        }

        const rate = data.rates?.[detailCurrency];

        if (typeof rate !== "number") {
          throw new Error("Historical rate was not available.");
        }

        setHistoricalRate(rate);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setDetailError("Unable to load historical rate.");
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    loadHistoricalRate();

    return () => {
      cancelled = true;
    };
  }, [baseCurrency, detailCurrency]);

  // Load the supported currency list once
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

  // Search/filtering
  const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

  const filteredRates = Object.entries(rates).filter(([code]) => {
    const name = currencies[code] || "";

    return (
      code.toLowerCase().includes(normalizedSearch) ||
      name.toLowerCase().includes(normalizedSearch)
    );
  });

  // Converter calculations
  const numericAmount = Number(amount);

  const sourceRate =
    sourceCurrency === baseCurrency ? 1 : rates[sourceCurrency];

  const targetRate =
    targetCurrency === baseCurrency ? 1 : rates[targetCurrency];

  let convertedAmount = null;

  if (
    Number.isFinite(numericAmount) &&
    numericAmount >= 0 &&
    sourceRate &&
    targetRate
  ) {
    convertedAmount =
      (numericAmount * targetRate) / sourceRate;
  }

  // Currency detail calculations
  const todayRate =
    detailCurrency === baseCurrency
      ? 1
      : rates[detailCurrency];

  let percentageChange = null;

  if (
    typeof todayRate === "number" &&
    typeof historicalRate === "number" &&
    historicalRate !== 0
  ) {
    percentageChange =
      ((todayRate - historicalRate) / historicalRate) * 100;
  }

  const changeLabel =
    percentageChange === null
      ? ""
      : percentageChange > 0
        ? "Up"
        : percentageChange < 0
          ? "Down"
          : "Unchanged";

  return (
    <section className="currency-section">
      <h2>Currencies</h2>

      {/* Base currency */}
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

      {/* Search */}
      <div className="currency-search">
        <label htmlFor="currency-search">
          Search currencies
        </label>

        <input
          id="currency-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by code or name"
        />
      </div>

      {/* Converter */}
      <div className="currency-converter">
        <h3>Currency Converter</h3>

        <div className="converter-row">
          <label htmlFor="converter-amount">
            Amount
          </label>

          <input
            id="converter-amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>

        <div className="converter-row">
          <label htmlFor="source-currency">
            From
          </label>

          <select
            id="source-currency"
            value={sourceCurrency}
            onChange={(event) =>
              setSourceCurrency(event.target.value)
            }
          >
            {currencyEntries.map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setSourceCurrency(targetCurrency);
            setTargetCurrency(sourceCurrency);
          }}
        >
          Swap
        </button>

        <div className="converter-row">
          <label htmlFor="target-currency">
            To
          </label>

          <select
            id="target-currency"
            value={targetCurrency}
            onChange={(event) =>
              setTargetCurrency(event.target.value)
            }
          >
            {currencyEntries.map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </select>
        </div>

        <div className="conversion-result">
          {convertedAmount === null ? (
            <p>
              Enter a valid amount and wait for rates to load.
            </p>
          ) : (
            <p>
              {numericAmount} {sourceCurrency} ={" "}
              {convertedAmount.toFixed(2)} {targetCurrency}
            </p>
          )}
        </div>
      </div>

      {/* Currency detail */}
      <div className="currency-detail">
        <h3>Currency Detail</h3>

        <div className="currency-controls">
          <label htmlFor="detail-currency">
            Currency
          </label>

          <select
            id="detail-currency"
            value={detailCurrency}
            onChange={(event) =>
              setDetailCurrency(event.target.value)
            }
          >
            {currencyEntries.map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </select>
        </div>

        {detailLoading ? (
          <p>Loading currency detail...</p>
        ) : detailError ? (
          <div>
            <p>{detailError}</p>
                <button
                    type="button"
                    onClick={() => setDetailRetry((value) => value + 1)}
                >
                Retry
                </button>

          </div>

        ) : historicalRate === null ? (
          <p>No historical rate is available.</p>
        ) : typeof todayRate !== "number" ? (
          <p>Today's rate is not available.</p>
        ) : (
          <div>
            <p>
              Today's rate: {todayRate}
            </p>

            <p>
              30 days ago: {historicalRate}
            </p>

            {percentageChange !== null && (
              <p
                className={
                  percentageChange > 0
                    ? "rate-up"
                    : percentageChange < 0
                      ? "rate-down"
                      : "rate-unchanged"
                }
              >
                {changeLabel}:{" "}
                {Math.abs(percentageChange).toFixed(2)}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* Latest rates */}
      {ratesLoading ? (
        <p>Loading latest rates...</p>
      ) : ratesError ? (
        <div>
          <p>{ratesError}</p>

          <button
            type="button"
            onClick={() =>
              setRatesRetry((value) => value + 1)
            }
          >
            Retry
          </button>
        </div>
      ) : Object.keys(rates).length === 0 ? (
        <p>No exchange rates are currently available.</p>
      ) : filteredRates.length === 0 ? (
        <p>
          No currencies match "{debouncedSearchTerm}".
        </p>
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
  {filteredRates.length === 0 ? (
    <tr>
      <td colSpan="3">
        No currencies match your search.
      </td>
    </tr>
  ) : (
    filteredRates.map(([code, rate]) => (
      <tr key={code}>
        <td>{code}</td>
        <td>{currencies[code] || code}</td>
        <td>{rate}</td>
      </tr>
    ))
  )}
</tbody>
        </table>
      )}
    </section>
  );
}

export default CurrencySection;