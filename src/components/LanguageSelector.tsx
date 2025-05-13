
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { languages } from "@/lib/languages";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Languages } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LanguageSelectorProps {
  onSelectLanguage: (sample: string) => void;
}

export default function LanguageSelector({
  onSelectLanguage
}: LanguageSelectorProps) {
  const [selectedLang, setSelectedLang] = useState<string>("hindi");
  
  const handleSelectLanguage = (language: string, sample: string) => {
    setSelectedLang(language);
    onSelectLanguage(sample);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title="Indian Language Samples">
          <Languages className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Samples</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <h3 className="font-medium mb-2">Indian Language Samples</h3>
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {Object.entries(languages).map(([key, { name, sample }]) => (
              <div 
                key={key} 
                className={`p-2 rounded-md cursor-pointer transition-colors ${selectedLang === key ? "bg-muted" : "hover:bg-muted/50"}`} 
                onClick={() => handleSelectLanguage(key, sample)}
              >
                <div className="font-medium">{name}</div>
                <div className="text-xs text-muted-foreground">{sample.substring(0, 30)}...</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
