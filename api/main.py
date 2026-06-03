"""
api/main.py — Flight Operations Performance Analytics API
Houston IAH & HOU · 2022-2026 · BTS Format
"""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd, numpy as np, os, json
from typing import Optional

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
DATA_DIR = os.path.join(BASE_DIR, "data", "raw")

app = FastAPI(title="Flight Ops Analytics API", description="Houston IAH & HOU · 2022-2026 · 2M+ flights", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_flights = _monthly = _delays = _routes = _stats = None

def load():
    global _flights, _monthly, _delays, _routes, _stats
    try:
        _flights = pd.read_parquet(os.path.join(DATA_DIR, "flights.parquet"))
        _monthly = pd.read_parquet(os.path.join(DATA_DIR, "monthly_summary.parquet"))
        _delays  = pd.read_parquet(os.path.join(DATA_DIR, "delay_breakdown.parquet"))
        _routes  = pd.read_parquet(os.path.join(DATA_DIR, "route_performance.parquet"))
        with open(os.path.join(DATA_DIR, "stats.json")) as f: _stats = json.load(f)
        print(f"✅ {len(_flights):,} flights loaded")
    except Exception as e:
        print(f"⚠️ Run: python src/generate_data.py ({e})")

load()

def safe(df): return df.where(pd.notnull(df), None).to_dict("records")

@app.get("/")
def root(): return {"message": "Flight Ops Analytics API", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status":"ok","flights_loaded": _flights is not None,
            "total_flights": len(_flights) if _flights is not None else 0, "period":"2022-2026"}

@app.get("/stats")
def stats(): return _stats or {}

@app.get("/overview")
def overview(year: int = Query(2026), airport: Optional[str] = None):
    if _monthly is None: return {}
    df = _monthly[_monthly["year"] == year].copy()
    if airport: df = df[df["origin"] == airport.upper()]
    total   = int(df["total_flights"].sum())
    cancel  = int(df["cancelled_flights"].sum())
    delayed = int(df["delayed_flights"].sum())
    operated= total - cancel
    return {
        "year": year, "airport": airport or "ALL",
        "total_flights":     total,
        "operated_flights":  operated,
        "cancelled_flights": cancel,
        "delayed_flights":   delayed,
        "otp_rate_pct":      round((operated - delayed) / operated * 100, 2) if operated > 0 else 0,
        "cancellation_rate_pct": round(cancel / total * 100, 3) if total > 0 else 0,
        "avg_dep_delay_min": round(float(df["avg_dep_delay"].mean()), 2),
        "avg_turnaround_min":round(float(df["avg_turnaround"].mean()), 2),
        "avg_taxi_out_min":  round(float(df["avg_taxi_out"].mean()), 2),
    }

@app.get("/otp")
def otp(airport: Optional[str] = None, carrier: Optional[str] = None):
    if _monthly is None: return []
    df = _monthly.copy()
    if airport: df = df[df["origin"] == airport.upper()]
    if carrier: df = df[df["carrier"] == carrier.upper()]
    agg = df.groupby(["year","month","carrier","airline_name"]).agg(
        total=("total_flights","sum"), cancelled=("cancelled_flights","sum"),
        delayed=("delayed_flights","sum"), avg_delay=("avg_dep_delay","mean")
    ).reset_index()
    agg["otp_rate"] = ((agg["total"] - agg["cancelled"] - agg["delayed"]) / agg["total"] * 100).round(2)
    return safe(agg.sort_values(["year","month"]))

@app.get("/otp-by-airline")
def otp_by_airline(year: int = Query(2026), airport: Optional[str] = None):
    if _monthly is None: return []
    df = _monthly[_monthly["year"] == year].copy()
    if airport: df = df[df["origin"] == airport.upper()]
    agg = df.groupby(["carrier","airline_name"]).agg(
        total=("total_flights","sum"), cancelled=("cancelled_flights","sum"),
        delayed=("delayed_flights","sum"), avg_delay=("avg_dep_delay","mean"),
        avg_turnaround=("avg_turnaround","mean")
    ).reset_index()
    agg["otp_rate"] = ((agg["total"] - agg["cancelled"] - agg["delayed"]) / agg["total"] * 100).round(2)
    agg["cancel_rate"] = (agg["cancelled"] / agg["total"] * 100).round(3)
    return safe(agg.sort_values("otp_rate", ascending=False))

@app.get("/delays")
def delays(airport: Optional[str] = None, year: Optional[int] = None):
    if _delays is None: return []
    df = _delays.copy()
    if airport: df = df[df["origin"] == airport.upper()]
    if year:    df = df[df["year"] == year]
    agg = df.groupby(["year","month","delay_cause"]).agg(
        count=("count","sum"), avg_delay=("avg_delay","mean"), total_delay=("total_delay","sum")
    ).reset_index()
    return safe(agg.sort_values(["year","month"]))

@app.get("/delays-by-cause")
def delays_by_cause(year: int = Query(2026), airport: Optional[str] = None):
    if _delays is None: return []
    df = _delays[_delays["year"] == year].copy()
    if airport: df = df[df["origin"] == airport.upper()]
    agg = df.groupby("delay_cause").agg(
        count=("count","sum"), avg_delay=("avg_delay","mean"), total_delay=("total_delay","sum")
    ).reset_index()
    agg["pct"] = (agg["count"] / agg["count"].sum() * 100).round(1)
    return safe(agg.sort_values("count", ascending=False))

@app.get("/turnaround")
def turnaround(airport: Optional[str] = None):
    if _monthly is None: return []
    df = _monthly.copy()
    if airport: df = df[df["origin"] == airport.upper()]
    agg = df.groupby(["year","carrier","airline_name"]).agg(
        avg_turnaround=("avg_turnaround","mean"),
        avg_taxi_out=("avg_taxi_out","mean"),
        avg_taxi_in=("avg_taxi_in","mean"),
        avg_flight_time=("avg_flight_time","mean"),
        total_flights=("total_flights","sum"),
    ).round(2).reset_index()
    return safe(agg.sort_values(["year","avg_turnaround"]))

@app.get("/routes")
def routes(airport: Optional[str] = None, flight_type: Optional[str] = None, limit: int = Query(30)):
    if _routes is None: return []
    df = _routes.copy()
    if airport:      df = df[(df["origin"] == airport.upper()) | (df["dest"] == airport.upper())]
    if flight_type:  df = df[df["flight_type"].str.lower() == flight_type.lower()]
    return safe(df.head(limit))

@app.get("/hourly-pattern")
def hourly(airport: Optional[str] = None, year: int = Query(2026)):
    if _flights is None: return []
    df = _flights[_flights["year"] == year].copy()
    if airport: df = df[df["origin"] == airport.upper()]
    agg = df.groupby("dep_hour").agg(
        total=("flight_id","count"), delayed=("is_delayed","sum"),
        avg_delay=("dep_delay_min","mean"), cancelled=("cancelled","sum")
    ).reset_index()
    agg["otp_rate"] = ((agg["total"] - agg["cancelled"] - agg["delayed"]) / agg["total"] * 100).round(2)
    return safe(agg)

@app.get("/trends")
def trends(metric: str = Query("otp_rate"), airport: Optional[str] = None):
    if _monthly is None: return []
    df = _monthly.copy()
    if airport: df = df[df["origin"] == airport.upper()]
    available = {"otp_rate","delay_rate","cancellation_rate","avg_dep_delay","avg_turnaround","avg_taxi_out"}
    if metric not in available:
        return {"error": f"metric must be one of {list(available)}"}
    agg = df.groupby(["year","month"]).agg(
        otp_rate=("otp_rate","mean"),
        delay_rate=("delay_rate","mean"),
        cancellation_rate=("cancellation_rate","mean"),
        avg_dep_delay=("avg_dep_delay","mean"),
        avg_turnaround=("avg_turnaround","mean"),
        avg_taxi_out=("avg_taxi_out","mean"),
    ).round(3).reset_index()
    return safe(agg.sort_values(["year","month"]))
