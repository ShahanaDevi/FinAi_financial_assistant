import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
  { value: "ta", label: "தமிழ்" },
];

const LanguageToggle = ({ selectedLanguage, onLanguageChange }: LanguageToggleProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg border border-border">
      {languages.map((lang) => (
        <button
          key={lang.value}
          onClick={() => onLanguageChange(lang.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            selectedLanguage === lang.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
