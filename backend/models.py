from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

# -----------------------------
# USER TABLE
# -----------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    business_name = Column(String)
    gstin = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="user")
    snapshots = relationship("FinancialSnapshot", back_populates="user")
    integration_snapshots = relationship("IntegrationSnapshot", back_populates="user")

# -----------------------------
# TRANSACTIONS (BOOKKEEPING)
# -----------------------------
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String)
    date = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="transactions")

# -----------------------------
# FINANCIAL SNAPSHOT
# -----------------------------
class FinancialSnapshot(Base):
    __tablename__ = "financial_snapshots"

    id = Column(Integer, primary_key=True, index=True)

    revenue = Column(Float)
    expenses = Column(Float)
    profit_margin = Column(Float)
    cash_flow = Column(Float)
    creditworthiness = Column(String)

    gst_status = Column(String)
    forecast_summary = Column(String)
    working_capital_status = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="snapshots")

# -----------------------------
# INTEGRATION SNAPSHOT
# -----------------------------
class IntegrationSnapshot(Base):
    __tablename__ = "integration_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)  # e.g., gst, banking
    reference = Column(String, nullable=True)  # e.g., filing reference id
    status = Column(String, nullable=True)
    balance = Column(Float, nullable=True)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="integration_snapshots")
