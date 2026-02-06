def forecast_financials(df, growth_rate=0.05):
    # WHY: allow growth rate to be configurable for different business conditions.
    if df is None or "amount" not in df.columns:
        return {"error": "Missing 'amount' column for forecasting"}
    monthly_avg = df["amount"].mean()
    if monthly_avg != monthly_avg:  # NaN check without extra deps
        return {"error": "No valid amount values to forecast"}
    return {
        "next_month": round(monthly_avg * (1 + float(growth_rate)), 2),
        "three_months": round(monthly_avg * 3, 2),
    }
