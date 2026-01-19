import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ExpenseModeContextType {
  isExpenseMode: boolean;
  toggleExpenseMode: () => void;
  setExpenseMode: (value: boolean) => void;
}

const ExpenseModeContext = createContext<ExpenseModeContextType | undefined>(undefined);

export function ExpenseModeProvider({ children }: { children: ReactNode }) {
  const [isExpenseMode, setIsExpenseMode] = useState(false);

  const toggleExpenseMode = useCallback(() => {
    setIsExpenseMode((prev) => !prev);
  }, []);

  const setExpenseMode = useCallback((value: boolean) => {
    setIsExpenseMode(value);
  }, []);

  return (
    <ExpenseModeContext.Provider value={{ isExpenseMode, toggleExpenseMode, setExpenseMode }}>
      {children}
    </ExpenseModeContext.Provider>
  );
}

export function useExpenseMode() {
  const context = useContext(ExpenseModeContext);
  if (!context) {
    throw new Error('useExpenseMode must be used within ExpenseModeProvider');
  }
  return context;
}
