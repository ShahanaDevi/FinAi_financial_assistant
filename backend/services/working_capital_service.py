def working_capital_analysis(cash_flow):
    try:
        cash_flow_value = float(cash_flow)
    except (TypeError, ValueError):
        return "Invalid cash flow value provided"

    if cash_flow_value < 0:
        return "Improve collections or consider short-term working capital loan"
    return "Working capital position is healthy"
