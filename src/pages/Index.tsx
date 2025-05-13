
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import EncoderDecoder from "@/components/EncoderDecoder";
import Header from "@/components/Header";
import HistoryPanel from "@/components/HistoryPanel";
import { HistoryProvider } from "@/lib/historyContext";
import "../lib/i18n"; // Import i18n configuration

const Index = () => {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const [encoderDecoderState, setEncoderDecoderState] = useState<{
    input: string;
    output: string;
    type: 'encode' | 'decode';
  } | null>(null);

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleHistoryItemSelect = (input: string, output: string, type: 'encode' | 'decode') => {
    setEncoderDecoderState({ input, output, type });
    setShowHistory(false);
  };

  return (
    <HistoryProvider>
      <div className="flex flex-col min-h-screen">
        <Header onToggleHistory={handleToggleHistory} />
        
        <main className="flex-1 container py-6 px-4 relative">
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('encode.title')}</h2>
            <p className="text-muted-foreground">
              {t('encode.subtitle')}
            </p>
          </div>
          
          <EncoderDecoder />
          
          {showHistory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4">
              <HistoryPanel 
                onClose={() => setShowHistory(false)} 
                onSelectHistoryItem={handleHistoryItemSelect}
              />
            </div>
          )}
        </main>
      </div>
    </HistoryProvider>
  );
};

export default Index;
