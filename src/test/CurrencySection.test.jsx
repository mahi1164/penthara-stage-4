import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CurrencySection from "../components/CurrencySection";
import {
  fetchCurrencies,
  fetchLatestRates,
  fetchHistoricalRate,
} from "../utils/currencyApi";

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