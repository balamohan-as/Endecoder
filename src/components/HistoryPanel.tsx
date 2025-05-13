
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHistory } from "@/lib/historyContext";
import { Search, Trash, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HistoryPanelProps {
  onClose: () => void;
  onSelectHistoryItem: (input: string, output: string, type: 'encode' | 'decode') => void;
}

export default function HistoryPanel({ onClose, onSelectHistoryItem }: HistoryPanelProps) {
  const { t } = useTranslation();
  const { history, clearHistory, deleteHistoryItem, searchHistory } = useHistory();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredHistory = searchQuery ? searchHistory(searchQuery) : history;

  function handleClearHistory() {
    if (window.confirm("Are you sure you want to clear all history?")) {
      clearHistory();
    }
  }

  function truncate(str: string, length: number = 40) {
    return str.length > length ? str.substring(0, length) + "..." : str;
  }

  return (
    <Card className="w-full max-w-md h-[600px] flex flex-col shadow-lg animate-fade-in">
      <CardHeader className="flex-row justify-between items-center pb-2">
        <CardTitle className="text-lg">{t('history.title')}</CardTitle>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearHistory}
              className="h-8"
              title={t('history.clearAll')}
            >
              <Trash className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t('history.clearAll')}</span>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('history.search')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="flex-1 overflow-hidden p-0 pb-4">
        {filteredHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            {history.length === 0 ? (
              <p>{t('history.noHistory')}</p>
            ) : (
              <p>{t('history.noResults')}</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full px-4">
            <div className="space-y-2">
              {filteredHistory.map((item) => (
                <div 
                  key={item.id}
                  className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectHistoryItem(item.input, item.output, item.type)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium ${item.type === 'encode' ? 'text-orange-500' : 'text-blue-500'}`}>
                      {t(item.type === 'encode' ? 'history.encoded' : 'history.decoded')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="overflow-hidden">
                      <p className="text-xs text-muted-foreground">{t('history.input')}</p>
                      <p className="text-sm truncate">{truncate(item.input)}</p>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-muted-foreground">{t('history.output')}</p>
                      <p className="text-sm truncate">{truncate(item.output)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
