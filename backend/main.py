# -----------------------------
# LOAD ENV FIRST (CRITICAL)
# -----------------------------
from dotenv import load_dotenv
import os

from database import engine, SessionLocal
from models import Base

Base.metadata.create_all(bind=engine)

load_dotenv()
print("GEMINI KEY FOUND:", bool(os.getenv("GEMINI_API_KEY")))


# -----------------------------
# NORMAL IMPORTS
# -----------------------------
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd

from analysis import analyze_financials
from ai_insights import generate_insights, check_ai_health
from security import get_encryption_manager, encryption_required, https_required
from services.bookkeeping_services import categorize_transactions
from services.forecasting_service import forecast_financials
from services.gst_compliance_service import check_gst_compliance
from services.working_capital_service import working_capital_analysis
from integrations.registry import get_enabled_integrations, get_banking_client, get_gst_client
from models import IntegrationSnapshot

# -----------------------------
# FASTAPI APP
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def enforce_https(request, call_next):
    # WHY: enforce HTTPS for all requests when required by policy.
    if https_required():
        forwarded_proto = request.headers.get("x-forwarded-proto")
        if forwarded_proto != "https":
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "HTTPS is required for all financial data in transit.",
                },
            )
    return await call_next(request)


def _encryption_guard():
    # WHY: ensure at-rest encryption is enforced when required by policy.
    if encryption_required() and not get_encryption_manager().enabled:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "message": "Encryption is required but not configured. Set FINAI_DATA_KEY.",
            },
        )
    return None

# -----------------------------
# REQUEST MODEL
# -----------------------------
class AIInsightRequest(BaseModel):
    metrics: dict
    conversation: list
    language: str = "en"
    ai_mode: Optional[str] = None


class GSTCheckRequest(BaseModel):
    revenue: float
    threshold: Optional[float] = None


class WorkingCapitalRequest(BaseModel):
    cash_flow: float


class ForecastRequest(BaseModel):
    amounts: list
    growth_rate: Optional[float] = 0.05


class BookkeepingRequest(BaseModel):
    transactions: list


class IntegrationSnapshotRequest(BaseModel):
    user_id: Optional[int] = None
    source: str
    reference: Optional[str] = None
    status: Optional[str] = None
    balance: Optional[float] = None
    details: Optional[str] = None

# -----------------------------
# AI INSIGHTS ENDPOINT
# -----------------------------
@app.post("/ai-insights")
async def ai_insights(payload: AIInsightRequest):
    try:
        guard = _encryption_guard()
        if guard:
            return guard
        insights = generate_insights(
            metrics=payload.metrics,
            conversation=payload.conversation,
            language=payload.language,
            ai_mode=payload.ai_mode,
        )
        return {"insights": insights}

    except Exception as e:
        import traceback
        traceback.print_exc()   # 🔥 SHOW REAL ERROR
        return {"insights": "Unable to generate insights"}


@app.get("/health/ai")
async def ai_health():
    # WHY: expose a simple health check for Gemini connectivity.
    guard = _encryption_guard()
    if guard:
        return guard
    return check_ai_health()
# -----------------------------
# FILE UPLOAD ENDPOINT
# -----------------------------
# WHY: provide concrete Swagger examples so reviewers and users can test each supported CSV format.
_UPLOAD_OPENAPI_EXAMPLES = {
    "amount_signed": {
        "summary": "Signed amount (positive income, negative expense)",
        "description": "Use a single amount column with +/- values.",
        "value": (
            "date,description,amount\n"
            "2025-01-05,Sales Invoice,25000\n"
            "2025-01-06,Office Rent,-8000\n"
            "2025-01-07,Utilities,-1200\n"
        ),
    },
    "amount_with_type": {
        "summary": "Amount + type (credit/debit or income/expense)",
        "description": "Use amount with a transaction type column.",
        "value": (
            "date,description,amount,type\n"
            "2025-01-05,Sales Invoice,25000,credit\n"
            "2025-01-06,Office Rent,8000,debit\n"
            "2025-01-07,Utilities,1200,expense\n"
        ),
    },
    "credit_debit": {
        "summary": "Credit + debit columns",
        "description": "Use separate credit and debit columns.",
        "value": (
            "date,description,credit,debit\n"
            "2025-01-05,Sales Invoice,25000,0\n"
            "2025-01-06,Office Rent,0,8000\n"
            "2025-01-07,Utilities,0,1200\n"
        ),
    },
}


@app.post(
    "/upload",
    openapi_extra={
        "requestBody": {
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "file": {
                                "type": "string",
                                "format": "binary",
                                "description": "CSV file containing transactions",
                            }
                        },
                        "required": ["file"],
                    },
                    "examples": _UPLOAD_OPENAPI_EXAMPLES,
                }
            }
        }
    },
)
async def upload_file(file: UploadFile = File(..., description="CSV file upload")):
    try:
        guard = _encryption_guard()
        if guard:
            return guard
        df = pd.read_csv(file.file)

        print("CSV columns:", df.columns.tolist())
        print("First 5 rows:")
        print(df.head())

        result = analyze_financials(df)
        if isinstance(result, dict) and result.get("status") == "clarification_needed":
            # WHY: return actionable, user-friendly feedback instead of a raw exception.
            return JSONResponse(status_code=422, content=result)
        return result

    except Exception as e:
        print("🔥 BACKEND ERROR:", str(e))
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Unable to process the uploaded CSV. Please verify the file format.",
            },
        )


@app.post("/bookkeeping/categorize")
async def bookkeeping_categorize(payload: BookkeepingRequest):
    # WHY: support JSON-based testing without requiring CSV uploads.
    try:
        guard = _encryption_guard()
        if guard:
            return guard
        df = pd.DataFrame(payload.transactions)
        result = categorize_transactions(df)
        if isinstance(result, dict) and result.get("error"):
            return JSONResponse(status_code=422, content=result)
        return {"categories": result}
    except Exception:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Unable to categorize transactions. Please verify the payload.",
            },
        )


@app.post("/gst/check")
async def gst_check(payload: GSTCheckRequest):
    # WHY: keep GST threshold configurable for regulatory changes.
    guard = _encryption_guard()
    if guard:
        return guard
    result = check_gst_compliance(payload.revenue, payload.threshold)
    return {"status": result}


@app.post("/forecast")
async def forecast(payload: ForecastRequest):
    try:
        guard = _encryption_guard()
        if guard:
            return guard
        df = pd.DataFrame([{"amount": a} for a in payload.amounts])
        result = forecast_financials(df, growth_rate=payload.growth_rate)
        if isinstance(result, dict) and result.get("error"):
            return JSONResponse(status_code=422, content=result)
        return result
    except Exception:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Unable to generate forecast. Please verify amounts.",
            },
        )


@app.post("/working-capital")
async def working_capital(payload: WorkingCapitalRequest):
    guard = _encryption_guard()
    if guard:
        return guard
    result = working_capital_analysis(payload.cash_flow)
    return {"status": result}


@app.get("/integrations/status")
async def integrations_status():
    # WHY: enforce max 2 integrations and make config visible to reviewers.
    return {"enabled": get_enabled_integrations()}


@app.post("/integrations/gst/gstr1")
async def gst_gstr1(payload: dict):
    guard = _encryption_guard()
    if guard:
        return guard
    client = get_gst_client()
    return client.submit_gstr1(payload)


@app.post("/integrations/gst/gstr3b")
async def gst_gstr3b(payload: dict):
    guard = _encryption_guard()
    if guard:
        return guard
    client = get_gst_client()
    return client.submit_gstr3b(payload)


@app.get("/integrations/banking/accounts")
async def banking_accounts():
    guard = _encryption_guard()
    if guard:
        return guard
    client = get_banking_client()
    return {"accounts": client.fetch_accounts()}


@app.get("/integrations/banking/transactions/{account_id}")
async def banking_transactions(account_id: str):
    guard = _encryption_guard()
    if guard:
        return guard
    client = get_banking_client()
    return {"transactions": client.fetch_transactions(account_id)}


@app.post("/integrations/snapshots")
async def create_integration_snapshot(payload: IntegrationSnapshotRequest):
    # WHY: persist integration results for auditability and dashboards.
    guard = _encryption_guard()
    if guard:
        return guard
    try:
        db = SessionLocal()
        snapshot = IntegrationSnapshot(
            user_id=payload.user_id,
            source=payload.source,
            reference=payload.reference,
            status=payload.status,
            balance=payload.balance,
            details=payload.details,
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return {
            "id": snapshot.id,
            "source": snapshot.source,
            "status": snapshot.status,
            "balance": snapshot.balance,
            "created_at": snapshot.created_at,
        }
    except Exception:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Unable to store integration snapshot. Please verify the payload.",
            },
        )
    finally:
        try:
            db.close()
        except Exception:
            pass


@app.get("/integrations/snapshots")
async def list_integration_snapshots(user_id: Optional[int] = None, source: Optional[str] = None):
    # WHY: allow timestamped history for GST filings / bank balances.
    guard = _encryption_guard()
    if guard:
        return guard
    db = SessionLocal()
    try:
        query = db.query(IntegrationSnapshot)
        if user_id is not None:
            query = query.filter(IntegrationSnapshot.user_id == user_id)
        if source:
            query = query.filter(IntegrationSnapshot.source == source)
        rows = query.order_by(IntegrationSnapshot.created_at.desc()).limit(100).all()
        return {
            "items": [
                {
                    "id": row.id,
                    "user_id": row.user_id,
                    "source": row.source,
                    "reference": row.reference,
                    "status": row.status,
                    "balance": row.balance,
                    "details": row.details,
                    "created_at": row.created_at,
                }
                for row in rows
            ]
        }
    finally:
        db.close()
