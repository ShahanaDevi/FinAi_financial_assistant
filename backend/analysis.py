import pandas as pd

from typing import Dict, List, Optional, Tuple


DEFAULT_ANALYSIS_CONFIG: Dict[str, float] = {
    # WHY: make thresholds overrideable without changing code, while keeping defaults
    # for backward compatibility with current behavior.
    "profit_margin_high": 15.0,
    "profit_margin_medium": 5.0,
    "profit_margin_low_risk": 5.0,
    "expense_ratio_risk": 0.85,
    "health_score_max": 100.0,
}

_AMOUNT_COLUMNS = [
    "amount",
    "amt",
    "value",
    "net_amount",
    "transaction_amount",
]
_TYPE_COLUMNS = [
    "type",
    "txn_type",
    "transaction_type",
    "dr_cr",
    "credit_debit",
    "income_expense",
]
_CREDIT_COLUMNS = ["credit", "cr", "deposit", "inflow", "cash_in", "money_in", "receipts"]
_DEBIT_COLUMNS = ["debit", "dr", "withdrawal", "outflow", "cash_out", "money_out", "payments"]
_INFLOW_COLUMNS = ["cash_in", "inflow", "money_in", "receipts"]
_OUTFLOW_COLUMNS = ["cash_out", "outflow", "money_out", "payments"]

_CREDIT_ALIASES = {"credit", "cr", "income", "inflow", "receipt", "receipts"}
_DEBIT_ALIASES = {"debit", "dr", "expense", "outflow", "payment", "payments"}


def analyze_financials(df: pd.DataFrame, config: Optional[Dict[str, float]] = None) -> dict:
    """
    Takes a pandas DataFrame from uploaded CSV and returns financial analysis results.
    """
    normalized = _normalize_cash_flows(df)
    if normalized["status"] != "ok":
        # WHY: return friendly, structured messages so API callers (Swagger) can act without stack traces.
        return normalized

    df = normalized["data"]
    source_format = normalized.get("source_format")
    transactions = _build_transaction_rows(df)
    cfg = {**DEFAULT_ANALYSIS_CONFIG, **(config or {})}

    # ---------------------------------------------
    # 3. BASIC FINANCIAL METRICS
    # ---------------------------------------------
    total_revenue = float(df["cash_in"].sum())
    total_expenses = float(df["cash_out"].sum())
    profit = total_revenue - total_expenses

    profit_margin = (profit / total_revenue) * 100 if total_revenue > 0 else 0.0
    cash_flow = profit

    # ---------------------------------------------
    # 4. FINANCIAL HEALTH SCORE (0–100)
    # ---------------------------------------------
    health_score = 0

    if profit_margin > cfg["profit_margin_high"]:
        health_score += 40
    elif profit_margin > cfg["profit_margin_medium"]:
        health_score += 25
    else:
        health_score += 10

    if cash_flow > 0:
        health_score += 40
    else:
        health_score += 15

    if total_revenue > 0:
        health_score += 20

    health_score = min(int(health_score), int(cfg["health_score_max"]))

    # ---------------------------------------------
    # 5. CREDITWORTHINESS
    # ---------------------------------------------
    creditworthiness = evaluate_creditworthiness(health_score)

    # ---------------------------------------------
    # 6. RISK IDENTIFICATION
    # ---------------------------------------------
    risks = []

    if profit_margin < cfg["profit_margin_low_risk"]:
        risks.append("Low profit margin")

    if cash_flow < 0:
        risks.append("Negative cash flow")

    if total_expenses > total_revenue * cfg["expense_ratio_risk"]:
        risks.append("High operating expenses")

    if not risks:
        risks.append("No major financial risks detected")

    # ---------------------------------------------
    # 7. PRODUCT RECOMMENDATIONS
    # ---------------------------------------------
    recommended_products = recommend_financial_products(
        cash_flow, profit_margin, creditworthiness
    )

    # ---------------------------------------------
    # 8. FINAL RESPONSE (JSON SAFE)
    # ---------------------------------------------
    return {
        "source_format": source_format,
        "revenue": round(total_revenue, 2),
        "expenses": round(total_expenses, 2),
        "profit_margin": round(float(profit_margin), 2),
        "cash_flow": round(float(cash_flow), 2),
        "health_score": health_score,
        "creditworthiness": creditworthiness,
        "risks": [str(r) for r in risks],
        # WHY: include raw transaction rows for downstream features without breaking summary metrics.
        "transactions": transactions,
        "recommended_products": [
            {
                "product": str(p["product"]),
                "provider": str(p["provider"]),
                "reason": str(p["reason"]),
            }
            for p in recommended_products
        ],
    }


def evaluate_creditworthiness(score: int) -> str:
    if score >= 75:
        return "High"
    elif score >= 50:
        return "Medium"
    else:
        return "Low"


def recommend_financial_products(cash_flow, profit_margin, creditworthiness):
    products = []

    if cash_flow < 0:
        products.append({
            "product": "Invoice Financing",
            "provider": "NBFC",
            "reason": "Helps manage short-term cash flow gaps caused by delayed receivables."
        })

    if profit_margin < 10:
        products.append({
            "product": "Working Capital Loan",
            "provider": "Bank",
            "reason": "Supports daily operational expenses and stabilizes business cash flow."
        })

    if creditworthiness == "High":
        products.append({
            "product": "Business Overdraft",
            "provider": "Bank",
            "reason": "Provides flexible credit access for short-term liquidity needs."
        })

    if not products:
        products.append({
            "product": "Savings / Term Deposit",
            "provider": "Bank",
            "reason": "Suitable for financially stable businesses with surplus cash."
        })

    return products


def _normalize_cash_flows(df: pd.DataFrame) -> dict:
    # WHY: keep CSV format flexibility inside a single normalization layer.
    if df is None or not isinstance(df, pd.DataFrame) or df.empty:
        return _clarification(
            "We could not read any transaction rows from the uploaded file.",
            clarifications=[
                "Please upload a CSV with at least one transaction row.",
            ],
            sample_columns=[],
        )

    working_df = df.copy()
    working_df.columns = (
        working_df.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    amount_col = _pick_column(working_df.columns, _AMOUNT_COLUMNS)
    type_col = _pick_column(working_df.columns, _TYPE_COLUMNS)
    credit_col = _pick_column(working_df.columns, _CREDIT_COLUMNS)
    debit_col = _pick_column(working_df.columns, _DEBIT_COLUMNS)
    inflow_col = _pick_column(working_df.columns, _INFLOW_COLUMNS)
    outflow_col = _pick_column(working_df.columns, _OUTFLOW_COLUMNS)

    # Case A: amount + type (income/expense/credit/debit)
    if amount_col and type_col:
        working_df["amount"] = _coerce_numeric(working_df[amount_col])
        working_df["type"] = (
            working_df[type_col].astype(str).str.strip().str.lower()
        )

        normalized_type = working_df["type"].map(_normalize_type_value)
        # WHY: fall back to sign when type is unclear instead of failing.
        cash_in = working_df["amount"].where(normalized_type == "credit", 0)
        cash_out = working_df["amount"].where(normalized_type == "debit", 0)

        # if type is unknown, infer from sign if possible
        unknown_mask = normalized_type.isna()
        if unknown_mask.any():
            signed_amount = working_df["amount"]
            cash_in = cash_in.where(~unknown_mask, signed_amount.where(signed_amount > 0, 0))
            cash_out = cash_out.where(~unknown_mask, signed_amount.where(signed_amount < 0, 0).abs())

            if (cash_in == 0).all() and (cash_out == 0).all():
                return _clarification(
                    "We could not infer transaction direction from the 'type' column.",
                    clarifications=[
                        "Please use values like Credit/Debit or Income/Expense in the type column.",
                    ],
                    sample_columns=[amount_col, type_col],
                )

        working_df["cash_in"] = cash_in.abs()
        working_df["cash_out"] = cash_out.abs()
        return _ok(working_df, source_format="amount+type")

    # Case B: credit + debit columns
    if credit_col and debit_col:
        working_df["cash_in"] = _coerce_numeric(working_df[credit_col]).abs()
        working_df["cash_out"] = _coerce_numeric(working_df[debit_col]).abs()
        return _ok(working_df, source_format="credit+debit")

    # Case C: explicit inflow/outflow columns
    if inflow_col and outflow_col:
        working_df["cash_in"] = _coerce_numeric(working_df[inflow_col]).abs()
        working_df["cash_out"] = _coerce_numeric(working_df[outflow_col]).abs()
        return _ok(working_df, source_format="cash_in+cash_out")

    # Case D: single amount column with signed values
    if amount_col and not type_col:
        working_df["amount"] = _coerce_numeric(working_df[amount_col])
        positive = working_df["amount"] > 0
        negative = working_df["amount"] < 0

        # WHY: treat signed-amount format only when both inflow and outflow signs exist.
        if positive.any() and negative.any():
            working_df["cash_in"] = working_df["amount"].where(positive, 0)
            working_df["cash_out"] = working_df["amount"].where(negative, 0).abs()
            return _ok(working_df, source_format="signed_amount")

        # WHY: all non-negative with no type is ambiguous (could be revenue-only or mixed).
        return _clarification(
            "All amounts are non-negative and no transaction type was provided.",
            clarifications=[
                "Please add a type column (Credit/Debit or Income/Expense), or provide separate credit/debit columns.",
            ],
            sample_columns=[amount_col],
        )

    # If we reach here, we could not infer the format
    return _clarification(
        "We could not detect a supported transaction format in your CSV.",
        clarifications=[
            "Use either amount+type, credit+debit, or a signed amount column.",
        ],
        sample_columns=list(working_df.columns),
    )


def _pick_column(columns: pd.Index, candidates: List[str]) -> Optional[str]:
    for name in candidates:
        if name in columns:
            return name
    return None


def _coerce_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").fillna(0)


def _normalize_type_value(value: str) -> Optional[str]:
    if value in _CREDIT_ALIASES:
        return "credit"
    if value in _DEBIT_ALIASES:
        return "debit"
    return None


def _ok(df: pd.DataFrame, source_format: str) -> dict:
    return {
        "status": "ok",
        "data": df,
        "source_format": source_format,
    }


def _clarification(message: str, clarifications: List[str], sample_columns: List[str]) -> dict:
    return {
        "status": "clarification_needed",
        "message": message,
        "clarifications": clarifications,
        "expected_formats": [
            {"amount": "amount", "type": "type (credit/debit or income/expense)"},
            {"credit": "credit", "debit": "debit"},
            {"amount": "amount (negative for expenses, positive for income)"},
        ],
        "sample_columns": sample_columns,
    }


def _build_transaction_rows(df: pd.DataFrame) -> List[dict]:
    # WHY: provide a consistent transaction payload for the frontend to reuse.
    if df is None or df.empty:
        return []
    description_col = "description" if "description" in df.columns else None

    rows: List[dict] = []
    for _, row in df.iterrows():
        cash_in = float(row.get("cash_in", 0) or 0)
        cash_out = float(row.get("cash_out", 0) or 0)
        amount = cash_in - cash_out
        tx_type = "credit" if amount >= 0 else "debit"
        rows.append(
            {
                "description": str(row.get(description_col, "")) if description_col else "",
                "amount": round(amount, 2),
                "type": tx_type,
            }
        )
    return rows
