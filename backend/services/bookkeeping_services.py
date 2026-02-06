def categorize_transactions(df):
    if df is None or "description" not in df.columns or "amount" not in df.columns:
        return {"error": "CSV must contain description and amount columns"}

    categories = []
    for _, row in df.iterrows():
        desc = str(row.get("description", "")).lower()
        amount = row.get("amount", 0)
        try:
            amount_value = float(amount)
        except (TypeError, ValueError):
            amount_value = 0

        if "rent" in desc:
            cat = "Rent"
        elif "salary" in desc:
            cat = "Salary"
        elif amount_value > 0:
            cat = "Revenue"
        else:
            cat = "Other Expense"

        categories.append(
            {"description": row.get("description", ""), "amount": amount_value, "category": cat}
        )
    return categories
