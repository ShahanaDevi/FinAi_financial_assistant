def check_gst_compliance(revenue, threshold=None):
    # WHY: allow GST thresholds to be configured without code changes.
    if threshold is None:
        threshold = 40_00_000
    try:
        revenue_value = float(revenue)
    except (TypeError, ValueError):
        return "Invalid revenue value provided"

    if revenue_value > float(threshold):
        return "GST registration required"
    return "GST registration not mandatory"
