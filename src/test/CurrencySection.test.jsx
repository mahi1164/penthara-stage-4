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