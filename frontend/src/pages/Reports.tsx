import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface RecommendedProduct {
  product: string;
  provider: string;
  reason: string;
}

interface AnalysisData {
  revenue: number;
  expenses: number;
  profit_margin: number;
  cash_flow: number;
  health_score: number;
  creditworthiness: string;
  risks: string[];
  recommended_products: RecommendedProduct[];
}

const Reports = () => {
  const { language, setLanguage } = useLanguage();

  const analysis: AnalysisData | null = JSON.parse(
    sessionStorage.getItem("analysisData") || "null"
  );

  if (!analysis) {
    return (
      <PageLayout>
        <p className="text-center mt-10 text-muted-foreground">
          No analysis data available. Please upload a file first.
        </p>
      </PageLayout>
    );
  }

  const t = {
    title:
      language === "hi"
        ? "वित्तीय सारांश रिपोर्ट"
        : language === "ta"
        ? "நிதி சுருக்க அறிக்கை"
        : "Financial Summary Report",

    subtitle:
      language === "hi"
        ? "आपके व्यवसाय के वित्तीय स्वास्थ्य का सारांश"
        : language === "ta"
        ? "உங்கள் வணிகத்தின் நிதி நிலை"
        : "Investor-ready overview of your business finances",

    download:
      language === "hi"
        ? "रिपोर्ट डाउनलोड करें"
        : language === "ta"
        ? "அறிக்கையை பதிவிறக்கவும்"
        : "Download Report",

    risks:
      language === "hi"
        ? "वित्तीय जोखिम"
        : language === "ta"
        ? "நிதி அபாயங்கள்"
        : "Financial Risks",

    products:
      language === "hi"
        ? "अनुशंसित वित्तीय उत्पाद"
        : language === "ta"
        ? "பரிந்துரைக்கப்பட்ட நிதி தயாரிப்புகள்"
        : "Recommended Financial Products",
  };

  const downloadReport = () => {
    const content = `
FINANCIAL SUMMARY REPORT

Revenue: ₹${analysis.revenue}
Expenses: ₹${analysis.expenses}
Cash Flow: ₹${analysis.cash_flow}
Profit Margin: ${analysis.profit_margin}%
Health Score: ${analysis.health_score}
Creditworthiness: ${analysis.creditworthiness}

RISKS:
${analysis.risks.join("\n")}

RECOMMENDED PRODUCTS:
${analysis.recommended_products
  .map(
    (p) => `${p.product} (${p.provider}) - ${p.reason}`
  )
  .join("\n")}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "financial_report.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex gap-2 bg-secondary rounded-lg p-1">
            <Button
              size="sm"
              variant={language === "en" ? "default" : "ghost"}
              onClick={() => setLanguage("en")}
            >
              English
            </Button>
            <Button
              size="sm"
              variant={language === "hi" ? "default" : "ghost"}
              onClick={() => setLanguage("hi")}
            >
              हिंदी
            </Button>
            <Button
              size="sm"
              variant={language === "ta" ? "default" : "ghost"}
              onClick={() => setLanguage("ta")}
            >
              தமிழ்
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Metric title="Health Score" value={analysis.health_score} />
          <Metric title="Creditworthiness" value={analysis.creditworthiness} />
          <Metric title="Profit Margin" value={`${analysis.profit_margin}%`} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Metric title="Total Revenue" value={`₹${analysis.revenue}`} />
          <Metric title="Total Expenses" value={`₹${analysis.expenses}`} />
        </div>

        {/* Risks */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">{t.risks}</h2>
          <ul className="list-disc pl-5 space-y-1">
            {analysis.risks.map((risk, idx) => (
              <li key={idx}>{risk}</li>
            ))}
          </ul>
        </div>

        {/* Products */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">{t.products}</h2>
          <div className="space-y-3">
            {analysis.recommended_products.map((p, idx) => (
              <div key={idx} className="border rounded p-3">
                <p className="font-medium">
                  {p.product} ({p.provider})
                </p>
                <p className="text-sm text-muted-foreground">
                  {p.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Download */}
        <Button
          onClick={downloadReport}
          className="w-full h-12 text-base font-semibold"
        >
          <Download className="h-4 w-4 mr-2" />
          {t.download}
        </Button>

      </div>
    </PageLayout>
  );
};

const Metric = ({ title, value }: { title: string; value: any }) => (
  <div className="metric-card">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default Reports;
