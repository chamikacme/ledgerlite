"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUserSettings } from "@/app/actions/accounts";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "ledgerlite_currency";
const TIMESTAMP_KEY = "ledgerlite_currency_timestamp";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>("LKR");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCurrency() {
      try {
        // Check if we have cached currency
        const cachedCurrency = localStorage.getItem(STORAGE_KEY);
        const cachedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
        const now = Date.now();

        // If cache exists and is less than a day old, use it
        if (cachedCurrency && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const age = now - timestamp;

          if (age < ONE_DAY_MS) {
            setCurrencyState(cachedCurrency);
            setIsLoading(false);
            return;
          }
        }

        // Otherwise, fetch from database
        const settings = await getUserSettings();
        const newCurrency = settings?.currency || "LKR";
        
        // Update state and cache
        setCurrencyState(newCurrency);
        localStorage.setItem(STORAGE_KEY, newCurrency);
        localStorage.setItem(TIMESTAMP_KEY, now.toString());
      } catch (error) {
        console.error("Failed to load currency:", error);
        // Fallback to cached value or default
        const cachedCurrency = localStorage.getItem(STORAGE_KEY);
        setCurrencyState(cachedCurrency || "LKR");
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrency();
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(STORAGE_KEY, newCurrency);
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
