import { createContext, useContext, useState } from "react";

type Lang = "en" | "hi" | "ta";

const LanguageContext = createContext<{
  language: Lang;
  setLanguage: (l: Lang) => void;
}>({
  language: "en",
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }: any) => {
  const [language, setLanguage] = useState<Lang>("en");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
