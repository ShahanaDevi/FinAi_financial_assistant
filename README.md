# AI-Powered Financial Intelligence Platform for SMEs

## Ì≥å Overview
This project is an AI-driven financial intelligence platform designed for Small and Medium Enterprises (SMEs). It ingests transaction data and provides automated bookkeeping, financial analysis, forecasting, working capital insights, cost optimization suggestions, and multilingual AI-based explanations through an interactive dashboard.

---

## ÌæØ Problem Statement
SMEs often struggle to interpret financial data, maintain compliance, and make informed business decisions due to fragmented tools and limited financial expertise.

---

## Ì≤° Solution
The platform enables SMEs to upload transaction data and receive:
- Automated categorization of transactions
- Key financial metrics and insights
- Visual dashboards and forecasts
- Cost optimization and working capital recommendations
- AI-powered conversational explanations

---

## ‚ú® Key Features
- Flexible CSV/XLSX upload with auto-detection and normalization
- Automated bookkeeping and category breakdown
- Financial metrics: revenue, expenses, profit margin, cash flow
- Forecasting and working capital optimization
- Cost optimization strategies
- Business-type specific insights (Retail, Services, Manufacturing)
- Multilingual support (English, Hindi, Tamil)
- AI insights with fallback logic
- Mock GST and banking integrations
- Secure API design with HTTPS enforcement

---

## Ì∑† AI Capabilities
- Provider-agnostic AI layer (validated with Claude/OpenAI)
- Gemini used for prototyping due to cost efficiency
- Multilingual financial explanations
- Executive-style summaries and risk insights

---

## Ìª†Ô∏è Tech Stack
**Frontend:** React  
**Backend:** FastAPI  
**Database:** SQLite (prototype)  
**AI:** Gemini (provider-agnostic design)  
**Visualization:** Charts for trends and category breakdowns  

---

## Ì¥ê Security
- HTTPS enforced for all financial APIs
- Configurable encryption guard for sensitive data
- Integration limits enforced at API level

---

## Ì∫Ä How to Run Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload

