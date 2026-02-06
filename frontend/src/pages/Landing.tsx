import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, TrendingUp, BarChart3, Brain, FileText, ChevronDown } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Landing = () => {
  const navigate = useNavigate();
  const [businessType, setBusinessType] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);


 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0];
  if (selectedFile) {
    setFile(selectedFile);
    setFileName(selectedFile.name);
  }
};


  const handleAnalyze = async () => {
  if (!file) {
    alert("Please upload a CSV file");
    return;
  }

  if (!businessType) {
    alert("Please select a business type");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("business_type", businessType);

  try {
    const res = await fetch(`${getApiBaseUrl()}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to analyze file");
    }

    const data = await res.json();
    const enrichedData = { ...data, business_type: businessType };

    // Navigate to dashboard WITH backend analysis data
  sessionStorage.setItem(
    "analysisData",
    JSON.stringify(enrichedData)
   );
  navigate("/dashboard", { state: enrichedData });

  } catch (error) {
    console.error(error);
    alert("Something went wrong while analyzing the file");
  }
};


  const features = [
    {
      icon: BarChart3,
      title: "Financial Health Score",
      description: "Get a comprehensive score based on key financial metrics",
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Ask questions and get personalized financial advice",
    },
    {
      icon: FileText,
      title: "Investor-Ready Reports",
      description: "Generate professional reports for stakeholders",
    },
  ];

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Financial Health Analyzer
            <span className="block text-primary mt-2">for SMEs</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your financial data and get instant insights, risk assessments, 
            and AI-powered recommendations to grow your business.
          </p>
        </div>

        {/* Upload Card */}
        <div className="metric-card max-w-xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            Start Your Analysis
          </h2>

          <div className="space-y-4">
            {/* Business Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Business Type
              </label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select your business type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Financial Data (CSV)
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  {fileName ? (
                    <p className="text-sm text-foreground font-medium">{fileName}</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              className="w-full gradient-primary text-primary-foreground h-12 text-base font-semibold hover:opacity-90 transition-opacity"
            >
              Analyze Financial Data
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="metric-card text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default Landing;
