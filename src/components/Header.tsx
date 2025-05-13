
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  onToggleHistory: () => void;
}

export default function Header({ onToggleHistory }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">{t('app.name')}</h1>
          <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
          onClick={onToggleHistory}
          title={t('header.history')}
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">{t('header.history')}</span>
        </Button>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
