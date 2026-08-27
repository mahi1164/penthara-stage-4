import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CurrencySection from "../components/CurrencySection";
import {
  fetchCurrencies,
  fetchLatestRates,
  fetchHistoricalRate,
} from "../utils/currencyApi";
import { calculatePercentageChange } from "../utils/currencyUtils";


vi.mock("../utils/currencyApi", () => ({
  fetchCurrencies: vi.fn(),
  fetchLatestRates: vi.fn(),
  fetchHistoricalRate: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();

  fetchCurrencies.mockResolvedValue({
    USD: "United States Dollar",
    EUR: "Euro",
    INR: "Indian Rupee",
  });

  fetchHistoricalRate.mockResolvedValue({
  rates: {
    EUR: 0.82,
  },
    });

  fetchLatestRates.mockResolvedValue({
    rates: {
      EUR: 0.85,
      INR: 90,
    },
  });

  
});

it("applies only the latest search after the debounce", async () => {
  render(<CurrencySection />);

  const searchInput = await screen.findByRole("searchbox");
  const table = screen.getByRole("table");

  vi.useFakeTimers();

  fireEvent.change(searchInput, {
    target: { value: "zzzz" },
  });

  // The old results should still be visible before 300ms.
  expect(table).toHaveTextContent("EUR");

  await act(async () => {
    vi.advanceTimersByTime(300);
  });

  // Now the latest search should be applied.
  expect(
  screen.getByText('No currencies match "zzzz".')
).toBeInTheDocument();

  vi.useRealTimers();
});

it("keeps the latest base currency rates when an older request resolves later", async () => {
  const usdRequest = new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        rates: {
          EUR: 0.85,
        },
      });
    }, 100);
  });

  const eurRequest = Promise.resolve({
    rates: {
      USD: 1.18,
    },
  });

  fetchLatestRates
    .mockImplementationOnce(() => usdRequest)
    .mockImplementationOnce(() => eurRequest);

  render(<CurrencySection />);

  const baseSelect = await screen.findByLabelText("Base currency");

  fireEvent.change(baseSelect, {
    target: { value: "EUR" },
  });

  await act(async () => {
    await eurRequest;
  });

  expect(screen.getByText("1.18")).toBeInTheDocument();

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  expect(screen.getByText("1.18")).toBeInTheDocument();
  expect(screen.queryByText("0.85")).not.toBeInTheDocument();
});

it("calculates the 30-day percentage change correctly", () => {
  expect(calculatePercentageChange(0.9, 0.8)).toBeCloseTo(12.5);
  expect(calculatePercentageChange(0.7, 0.8)).toBeCloseTo(-12.5);
  expect(calculatePercentageChange(0.8, 0)).toBeNull();
  expect(calculatePercentageChange(null, 0.8)).toBeNull();
});

it("retries the historical rate request after an error", async () => {
  fetchHistoricalRate
    .mockRejectedValueOnce(new Error("Network error"))
    .mockResolvedValueOnce({
      rates: {
        EUR: 0.82,
      },
    });

  render(<CurrencySection />);

  expect(
    await screen.findByText("Unable to load historical rate.")
  ).toBeInTheDocument();

  const retryButton = screen.getByRole("button", {
    name: "Retry",
  });

  fireEvent.click(retryButton);

  expect(fetchHistoricalRate).toHaveBeenCalledTimes(2);

  expect(
    await screen.findByText("30 days ago: 0.82")
  ).toBeInTheDocument();
});

it("keeps the latest base currency historical rate when an older request resolves later", async () => {
  const usdHistoricalRequest = new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        rates: {
          EUR: 0.82,
        },
      });
    }, 100);
  });

  const eurHistoricalRequest = Promise.resolve({
    rates: {
      USD: 1.15,
    },
  });

  fetchLatestRates
  .mockResolvedValueOnce({
    rates: {
      EUR: 0.85,
      INR: 90,
    },
  })
  .mockResolvedValueOnce({
    rates: {
      USD: 1.18,
    },
  });

  fetchHistoricalRate
    .mockImplementationOnce(() => usdHistoricalRequest)
    .mockImplementationOnce(() => eurHistoricalRequest);

  render(<CurrencySection />);

  const baseSelect = await screen.findByLabelText("Base currency");
  const detailSelect = await screen.findByLabelText("Currency");

  // Initial request is USD -> EUR.
  // Now switch base to EUR and detail to USD.
  fireEvent.change(baseSelect, {
    target: { value: "EUR" },
  });

  fireEvent.change(detailSelect, {
    target: { value: "USD" },
  });

  await act(async () => {
    await eurHistoricalRequest;
  });

  expect(screen.getByText(/30 days ago:\s*1\.15/)).toBeInTheDocument();

  // Let the older USD request resolve.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  // Old USD response must not overwrite the newer EUR result.
  expect(
  screen.getByText(/30 days ago:\s*1\.15/)
).toBeInTheDocument();
  expect(screen.queryByText("0.82")).not.toBeInTheDocument();
});