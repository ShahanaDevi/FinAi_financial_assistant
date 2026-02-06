import pandas as pd

from services.bookkeeping_services import categorize_transactions
from services.forecasting_service import forecast_financials
from services.gst_compliance_service import check_gst_compliance
from services.working_capital_service import working_capital_analysis


def test_categorize_transactions():
    df = pd.DataFrame(
        [
            {"description": "Office Rent May", "amount": -1200},
            {"description": "Staff Salary", "amount": -3000},
            {"description": "Client Payment", "amount": 5000},
            {"description": "Stationery", "amount": -200},
        ]
    )

    results = categorize_transactions(df)

    assert results == [
        {"description": "Office Rent May", "amount": -1200, "category": "Rent"},
        {"description": "Staff Salary", "amount": -3000, "category": "Salary"},
        {"description": "Client Payment", "amount": 5000, "category": "Revenue"},
        {"description": "Stationery", "amount": -200, "category": "Other Expense"},
    ]


def test_forecast_financials():
    df = pd.DataFrame([{"amount": 100}, {"amount": 200}])

    result = forecast_financials(df)

    assert result == {"next_month": 157.5, "three_months": 450.0}


def test_check_gst_compliance():
    assert check_gst_compliance(3_999_999) == "GST registration not mandatory"
    assert check_gst_compliance(4_000_000) == "GST registration not mandatory"
    assert check_gst_compliance(4_000_001) == "GST registration required"


def test_working_capital_analysis():
    assert (
        working_capital_analysis(-1)
        == "Improve collections or consider short-term working capital loan"
    )
    assert working_capital_analysis(0) == "Working capital position is healthy"
