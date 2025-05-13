import React, { createContext, useState, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  type: 'encode' | 'decode';
}

interface HistoryContextType {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  searchHistory: (query: string) => HistoryItem[];
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

// Maximum length for stored strings to prevent localStorage quota issues
const MAX_STRING_LENGTH = 1000;

// Function to truncate strings that are too long
const truncateIfNeeded = (str: string): string => {
  if (str.length > MAX_STRING_LENGTH) {
    return str.substring(0, MAX_STRING_LENGTH) + '... [truncated]';
  }
  return str;
};

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('endecoder_history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading history from localStorage:", error);
      return [];
    }
  });

  // Save history to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('endecoder_history', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage:", error);
      
      // Show error toast only for quota exceeded errors
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast({
          description: "Storage limit reached. Some history items may not be saved.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  }, [history, toast]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    // Handle large inputs and outputs by truncating them
    const truncatedItem = {
      ...item,
      input: truncateIfNeeded(item.input),
      output: truncateIfNeeded(item.output)
    };

    const newItem: HistoryItem = {
      ...truncatedItem,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    setHistory(prevHistory => {
      try {
        // Only keep the most recent 50 items (reduced from 100)
        const newHistory = [newItem, ...prevHistory].slice(0, 50);
        return newHistory;
      } catch (error) {
        console.error("Error adding to history:", error);
        return prevHistory;
      }
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
  };

  const searchHistory = (query: string): HistoryItem[] => {
    if (!query.trim()) return history;
    
    const lowerQuery = query.toLowerCase();
    return history.filter(
      item => item.input.toLowerCase().includes(lowerQuery) || 
              item.output.toLowerCase().includes(lowerQuery)
    );
  };

  return (
    <HistoryContext.Provider 
      value={{ history, addToHistory, clearHistory, deleteHistoryItem, searchHistory }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};
