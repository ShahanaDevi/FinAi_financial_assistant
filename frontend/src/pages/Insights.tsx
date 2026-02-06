import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send } from "lucide-react";
import ChatMessage from "@/components/insights/ChatMessage";
import LanguageToggle from "@/components/insights/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";

interface ChatMsg {
  id: number;
  isUser: boolean;
  textByLang: {
    en: string;
    hi: string;
    ta: string;
  };
}

const Insights = () => {
  const { language, setLanguage } = useLanguage();

  const analysis = JSON.parse(
    sessionStorage.getItem("analysisData") || "null"
  );

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);

  // -----------------------------
  // INITIAL WELCOME MESSAGE
  // -----------------------------
  useEffect(() => {
    setMessages([
      {
        id: 1,
        isUser: false,
        textByLang: {
          en: "Hello! I'm your AI Financial Assistant. I've analyzed your financial data and I'm ready to help you.",
          hi: "नमस्ते! मैं आपका AI वित्तीय सहायक हूँ। मैंने आपके वित्तीय डेटा का विश्लेषण किया है और आपकी मदद के लिए तैयार हूँ।",
          ta: "வணக்கம்! நான் உங்கள் AI நிதி உதவியாளர். உங்கள் நிதி தரவுகளை ஆய்வு செய்து உதவ தயாராக உள்ளேன்.",
        },
      },
    ]);
  }, []);

  // -----------------------------
  // SEND QUESTION
  // -----------------------------
  const sendQuestion = async (question: string) => {
    if (!question.trim()) return;

    const userMsg: ChatMsg = {
      id: Date.now(),
      isUser: true,
      textByLang: {
        en: question,
        hi: question, // user question stays same (real apps translate via API)
        ta: question,
      },
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const conversation = [
        ...messages.map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          text: msg.textByLang.en,
        })),
        { role: "user", text: question },
      ];

      const res = await fetch("http://localhost:8000/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: analysis,
          conversation,
          language,
          ai_mode: "always",
        }),
      });

      const data = await res.json();

      const aiText = data.insights || "Unable to generate insights.";

      const aiMsg: ChatMsg = {
        id: Date.now() + 1,
        isUser: false,
        textByLang: {
          en: aiText,
          hi: aiText, // backend already returns correct language
          ta: aiText,
        },
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallback = "Unable to generate insights at the moment.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isUser: false,
          textByLang: {
            en: fallback,
            hi: fallback,
            ta: fallback,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // TRANSLATE ASSISTANT MESSAGES ON LANGUAGE TOGGLE
  // -----------------------------
  useEffect(() => {
    let isMounted = true;

    const translateAssistantMessages = async () => {
      if (language === "en" || translating) return;
      const assistantMessages = messages.filter((msg) => !msg.isUser);
      const needsTranslation = assistantMessages.filter(
        (msg) => msg.textByLang[language] === msg.textByLang.en
      );
      if (needsTranslation.length === 0) return;

      try {
        setTranslating(true);
        const payload = needsTranslation.map((msg) => msg.textByLang.en);
        const res = await fetch("http://localhost:8000/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metrics: analysis,
            conversation: [
              {
                role: "user",
                text:
                  `Translate the following list of messages into ${language}. ` +
                  "Return ONLY valid JSON array of translated strings in the same order.\n\n" +
                  JSON.stringify(payload),
              },
            ],
            language,
            ai_mode: "always",
          }),
        });
        const data = await res.json();
        const translatedText = data.insights || "";
        let translations: string[] = [];
        try {
          translations = JSON.parse(translatedText);
        } catch {
          translations = [];
        }

        if (!isMounted) return;
        setMessages((prev) =>
          prev.map((item) => {
            if (item.isUser) return item;
            const index = needsTranslation.findIndex((msg) => msg.id === item.id);
            if (index === -1) return item;
            const translated = translations[index] || item.textByLang.en;
            return {
              ...item,
              textByLang: {
                ...item.textByLang,
                [language]: translated,
              },
            };
          })
        );
      } finally {
        if (isMounted) {
          setTranslating(false);
        }
      }
    };

    translateAssistantMessages();
    return () => {
      isMounted = false;
    };
  }, [analysis, language, messages, translating]);

  if (!analysis) {
    return (
      <PageLayout>
        <p className="text-center mt-10 text-muted-foreground">
          No analysis data available. Please upload a file first.
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                AI Financial Insights Assistant
              </h1>
              <p className="text-muted-foreground">
                Ask questions about your business finances
              </p>
            </div>
          </div>

          {/* ✅ LANGUAGE TOGGLE RESTORED */}
          <LanguageToggle
            selectedLanguage={language}
            onLanguageChange={setLanguage}
          />
        </div>

        {/* Chat */}
        <div className="metric-card p-0 overflow-hidden">
          <div className="h-[400px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg.textByLang[language]}
                isUser={msg.isUser}
              />
            ))}
            {loading && (
              <p className="text-sm text-muted-foreground">
                AI is thinking...
              </p>
            )}
            {translating && (
              <p className="text-sm text-muted-foreground">
                Translating previous responses...
              </p>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question about your business finances..."
                onKeyDown={(e) =>
                  e.key === "Enter" && sendQuestion(inputValue)
                }
              />
              <Button
                onClick={() => sendQuestion(inputValue)}
                disabled={loading}
                className="gradient-primary text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default Insights;
