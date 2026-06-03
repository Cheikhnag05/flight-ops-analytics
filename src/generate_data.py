"""
src/generate_data.py
Génère 2M+ enregistrements de vols réalistes pour Houston IAH & HOU
Basé sur le format BTS (Bureau of Transportation Statistics) 2022-2026
Reproduit et étend l'analyse de ponctualité menée chez Turkish Airlines
"""

import pandas as pd
import numpy as np
import json, os
from datetime import datetime, timedelta

np.random.seed(42)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")

# ── Configuration aéroports Houston ──────────────────────────────────────────
AIRPORTS = {
    "IAH": {
        "name": "George Bush Intercontinental",
        "city": "Houston", "state": "TX",
        "lat": 29.9902, "lng": -95.3368,
        "type": "International Hub",
        "gates": 130, "terminals": 5,
        "annual_capacity": 45_000_000,
    },
    "HOU": {
        "name": "William P. Hobby",
        "city": "Houston", "state": "TX",
        "lat": 29.6454, "lng": -95.2789,
        "type": "Domestic",
        "gates": 34, "terminals": 1,
        "annual_capacity": 14_000_000,
    },
}

# ── Compagnies aériennes (BTS carrier codes) ─────────────────────────────────
AIRLINES = {
    "AA": {"name": "American Airlines",   "hub": "IAH", "alliance": "oneworld",   "type": "Legacy",   "weight": 0.22},
    "UA": {"name": "United Airlines",     "hub": "IAH", "alliance": "Star",       "type": "Legacy",   "weight": 0.28},
    "WN": {"name": "Southwest Airlines",  "hub": "HOU", "alliance": "None",       "type": "LCC",      "weight": 0.25},
    "DL": {"name": "Delta Air Lines",     "hub": "IAH", "alliance": "SkyTeam",    "type": "Legacy",   "weight": 0.10},
    "B6": {"name": "JetBlue Airways",     "hub": "IAH", "alliance": "None",       "type": "LCC",      "weight": 0.05},
    "NK": {"name": "Spirit Airlines",     "hub": "HOU", "alliance": "None",       "type": "ULCC",     "weight": 0.04},
    "F9": {"name": "Frontier Airlines",   "hub": "HOU", "alliance": "None",       "type": "ULCC",     "weight": 0.03},
    "AS": {"name": "Alaska Airlines",     "hub": "IAH", "alliance": "oneworld",   "type": "Legacy",   "weight": 0.03},
}

# ── Top routes depuis Houston (BTS data) ─────────────────────────────────────
ROUTES = [
    ("IAH", "DFW", 239,  "AA", "Domestic"), ("IAH", "LAX", 1379, "UA", "Domestic"),
    ("IAH", "ORD", 925,  "UA", "Domestic"), ("IAH", "ATL", 789,  "DL", "Domestic"),
    ("IAH", "DEN", 879,  "UA", "Domestic"), ("IAH", "LGA", 1416, "UA", "Domestic"),
    ("IAH", "MIA", 964,  "AA", "Domestic"), ("IAH", "PHX", 1009, "AA", "Domestic"),
    ("IAH", "SEA", 1874, "UA", "Domestic"), ("IAH", "SFO", 1635, "UA", "Domestic"),
    ("IAH", "CDG", 5338, "UA", "International"), ("IAH", "LHR", 4822, "UA", "International"),
    ("IAH", "MEX", 737,  "UA", "International"), ("IAH", "GDL", 865,  "AA", "International"),
    ("IAH", "BOG", 2006, "UA", "International"), ("IAH", "GRU", 4767, "UA", "International"),
    ("HOU", "DAL", 239,  "WN", "Domestic"), ("HOU", "MDW", 925,  "WN", "Domestic"),
    ("HOU", "BWI", 1235, "WN", "Domestic"), ("HOU", "LAS", 1222, "WN", "Domestic"),
    ("HOU", "PHX", 1009, "WN", "Domestic"), ("HOU", "DEN", 879,  "WN", "Domestic"),
    ("HOU", "LAX", 1374, "WN", "Domestic"), ("HOU", "ORL", 985,  "WN", "Domestic"),
    ("HOU", "ATL", 791,  "WN", "Domestic"), ("HOU", "MCO", 985,  "NK", "Domestic"),
    ("HOU", "CUN", 874,  "WN", "International"), ("HOU", "MEX", 741,  "WN", "International"),
]

# ── Causes de retard (BTS standard) ──────────────────────────────────────────
DELAY_CAUSES = ["carrier", "weather", "nas", "security", "late_aircraft"]
DELAY_WEIGHTS = [0.38, 0.18, 0.22, 0.01, 0.21]

def seasonal_factor(month):
    """Saisonnalité : pics été (juin-août) et fêtes (nov-déc)"""
    factors = {1:0.88, 2:0.90, 3:0.95, 4:0.97, 5:1.02,
               6:1.12, 7:1.15, 8:1.10, 9:0.95, 10:0.97, 11:1.05, 12:1.08}
    return factors.get(month, 1.0)

def time_of_day_factor(hour):
    """Retards s'accumulent en journée (early morning = moins de retards)"""
    if 5 <= hour <= 8:  return 0.7
    if 9 <= hour <= 11: return 0.9
    if 12 <= hour <= 14: return 1.1
    if 15 <= hour <= 18: return 1.3
    if 19 <= hour <= 22: return 1.5
    return 0.6

def generate_flights():
    rows = []
    flight_id = 1

    # Générer ~2M vols sur 2022-2026 (~400k/an, ~1100/jour IAH+HOU)
    years   = range(2022, 2027)
    # Facteur de croissance trafic post-COVID
    traffic_growth = {2022: 0.88, 2023: 0.96, 2024: 1.00, 2025: 1.04, 2026: 1.07}

    for year in years:
        growth = traffic_growth[year]
        # Amélioration OTP tendancielle
        otp_trend = {2022: 0.78, 2023: 0.80, 2024: 0.82, 2025: 0.83, 2026: 0.84}
        base_otp  = otp_trend[year]

        for route in ROUTES:
            origin, dest, dist_mi, primary_carrier, flt_type = route

            # Fréquence vols/jour selon route
            if flt_type == "International": daily_freq = np.random.randint(1, 4)
            elif dist_mi < 500:             daily_freq = np.random.randint(6, 14)
            elif dist_mi < 1500:            daily_freq = np.random.randint(3, 8)
            else:                           daily_freq = np.random.randint(1, 5)

            daily_freq = int(daily_freq * growth)

            for month in range(1, 13):
                days_in_month = 30 if month in [4,6,9,11] else (28 if month==2 else 31)
                seas = seasonal_factor(month)
                monthly_flights = int(daily_freq * days_in_month * seas)

                for _ in range(monthly_flights):
                    day   = np.random.randint(1, days_in_month + 1)
                    hour  = int(np.random.choice([5,6,6,7,7,8,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]))
                    minute = np.random.choice([0,15,30,45])

                    # Sélection compagnie (primary + parfois autres)
                    carrier = primary_carrier if np.random.random() < 0.75 else np.random.choice(list(AIRLINES.keys()))

                    # OTP & retard
                    tod_factor = time_of_day_factor(hour)
                    airline_otp_bonus = {"UA":+0.02,"DL":+0.03,"AS":+0.02,"AA":0,"WN":-0.01,"B6":-0.02,"NK":-0.04,"F9":-0.04}
                    p_ontime = min(max(base_otp + airline_otp_bonus.get(carrier,0) - 0.05*(tod_factor-1), 0.60), 0.95)

                    is_delayed    = np.random.random() > p_ontime
                    is_cancelled  = np.random.random() < (0.025 if month in [1,2,12] else 0.012)
                    is_diverted   = not is_cancelled and np.random.random() < 0.003

                    dep_delay = 0
                    arr_delay = 0
                    delay_cause = None

                    if is_cancelled:
                        dep_delay = arr_delay = None
                    elif is_delayed:
                        delay_cause = np.random.choice(DELAY_CAUSES, p=DELAY_WEIGHTS)
                        base_delay  = {"carrier":25,"weather":45,"nas":20,"security":15,"late_aircraft":35}[delay_cause]
                        dep_delay   = int(np.random.exponential(base_delay) * tod_factor * (1 + 0.1*(month in [12,1,2])))
                        dep_delay   = max(dep_delay, 15)
                        arr_delay   = dep_delay + np.random.randint(-5, 20)
                        arr_delay   = max(arr_delay, 0)

                    # Temps vol & rotation
                    cruise_speed = 480 if flt_type == "International" else 450
                    flight_time_min = int((dist_mi / cruise_speed) * 60 + np.random.normal(10, 5))
                    taxi_out = int(np.random.normal(18, 5) * tod_factor)
                    taxi_in  = int(np.random.normal(8, 3))
                    gate_time = int(np.random.normal(45, 12))  # turnaround

                    # Numéro de vol
                    flt_num = f"{carrier}{np.random.randint(100,9999)}"

                    rows.append({
                        "flight_id":        flight_id,
                        "year":             year,
                        "month":            month,
                        "day":              day,
                        "date":             f"{year}-{month:02d}-{day:02d}",
                        "dep_hour":         hour,
                        "dep_minute":       minute,
                        "carrier":          carrier,
                        "airline_name":     AIRLINES[carrier]["name"],
                        "airline_type":     AIRLINES[carrier]["type"],
                        "flight_number":    flt_num,
                        "origin":           origin,
                        "dest":             dest,
                        "distance_mi":      dist_mi,
                        "flight_type":      flt_type,
                        "cancelled":        int(is_cancelled),
                        "diverted":         int(is_diverted),
                        "dep_delay_min":    dep_delay,
                        "arr_delay_min":    arr_delay,
                        "is_delayed":       int(is_delayed and not is_cancelled),
                        "delay_cause":      delay_cause if is_delayed and not is_cancelled else None,
                        "flight_time_min":  flight_time_min if not is_cancelled else None,
                        "taxi_out_min":     max(taxi_out, 5) if not is_cancelled else None,
                        "taxi_in_min":      max(taxi_in, 3) if not is_cancelled else None,
                        "gate_turnaround_min": gate_time if not is_cancelled else None,
                        "wheels_off":       (hour * 60 + minute + (dep_delay or 0) + max(taxi_out,5)) if not is_cancelled else None,
                        "wheels_on":        (hour * 60 + minute + (dep_delay or 0) + max(taxi_out,5) + flight_time_min) if not is_cancelled else None,
                    })
                    flight_id += 1

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    return df

def generate_monthly_summary(df):
    """Agrégats mensuels pour les dashboards."""
    mask = df["cancelled"] == 0
    agg = df.groupby(["year","month","carrier","origin"]).agg(
        total_flights   = ("flight_id","count"),
        cancelled_flights=("cancelled","sum"),
        delayed_flights  =("is_delayed","sum"),
        avg_dep_delay   =("dep_delay_min","mean"),
        avg_arr_delay   =("arr_delay_min","mean"),
        avg_taxi_out    =("taxi_out_min","mean"),
        avg_taxi_in     =("taxi_in_min","mean"),
        avg_turnaround  =("gate_turnaround_min","mean"),
        avg_flight_time =("flight_time_min","mean"),
        total_distance  =("distance_mi","sum"),
    ).round(2).reset_index()

    agg["otp_rate"]        = ((agg["total_flights"] - agg["cancelled_flights"] - agg["delayed_flights"]) / agg["total_flights"] * 100).round(2)
    agg["cancellation_rate"]= (agg["cancelled_flights"] / agg["total_flights"] * 100).round(3)
    agg["delay_rate"]       = (agg["delayed_flights"] / agg["total_flights"] * 100).round(2)
    agg["airline_name"]     = agg["carrier"].map({k:v["name"] for k,v in AIRLINES.items()})
    return agg

def generate_delay_breakdown(df):
    """Répartition retards par cause."""
    delayed = df[df["delay_cause"].notna()].copy()
    breakdown = delayed.groupby(["year","month","carrier","origin","delay_cause"]).agg(
        count       = ("flight_id","count"),
        avg_delay   = ("dep_delay_min","mean"),
        total_delay = ("dep_delay_min","sum"),
    ).round(2).reset_index()
    return breakdown

def generate_route_perf(df):
    """Performance par route."""
    mask = df["cancelled"] == 0
    route = df[mask].groupby(["origin","dest","carrier","flight_type"]).agg(
        total_flights   = ("flight_id","count"),
        avg_dep_delay   = ("dep_delay_min","mean"),
        avg_arr_delay   = ("arr_delay_min","mean"),
        avg_flight_time = ("flight_time_min","mean"),
        otp_count       = ("is_delayed","sum"),
        distance_mi     = ("distance_mi","first"),
    ).round(2).reset_index()
    route["otp_rate"] = ((route["total_flights"] - route["otp_count"]) / route["total_flights"] * 100).round(2)
    route["airline_name"] = route["carrier"].map({k:v["name"] for k,v in AIRLINES.items()})
    return route.sort_values("total_flights", ascending=False)

if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)

    print("✈️  Génération des vols Houston IAH & HOU 2022-2026...")
    df = generate_flights()
    df.to_parquet(os.path.join(OUT_DIR, "flights.parquet"), index=False)
    df.head(10000).to_csv(os.path.join(OUT_DIR, "flights_sample.csv"), index=False)
    print(f"   ✅ {len(df):,} vols générés — flights.parquet")

    print("📊 Agrégats mensuels...")
    monthly = generate_monthly_summary(df)
    monthly.to_parquet(os.path.join(OUT_DIR, "monthly_summary.parquet"), index=False)
    monthly.to_csv(os.path.join(OUT_DIR, "monthly_summary.csv"), index=False)
    print(f"   ✅ {len(monthly):,} lignes — monthly_summary.parquet")

    print("⏱️  Analyse retards...")
    delays = generate_delay_breakdown(df)
    delays.to_parquet(os.path.join(OUT_DIR, "delay_breakdown.parquet"), index=False)
    print(f"   ✅ {len(delays):,} lignes — delay_breakdown.parquet")

    print("🗺️  Performance routes...")
    routes = generate_route_perf(df)
    routes.to_parquet(os.path.join(OUT_DIR, "route_performance.parquet"), index=False)
    routes.to_csv(os.path.join(OUT_DIR, "route_performance.csv"), index=False)
    print(f"   ✅ {len(routes):,} routes — route_performance.parquet")

    # Stats globales
    cancelled = df["cancelled"].sum()
    delayed   = df["is_delayed"].sum()
    operated  = len(df) - cancelled
    stats = {
        "generated_at":    datetime.now().isoformat(),
        "period":          "2022-2026",
        "airports":        ["IAH","HOU"],
        "airlines":        len(AIRLINES),
        "total_flights":   len(df),
        "operated_flights": int(operated),
        "cancelled_flights": int(cancelled),
        "delayed_flights": int(delayed),
        "otp_rate_pct":    round((operated - delayed) / operated * 100, 2),
        "cancellation_rate_pct": round(cancelled / len(df) * 100, 3),
        "avg_dep_delay_min": round(df["dep_delay_min"].mean(), 2),
        "total_routes":    len(ROUTES),
        "total_distance_mi": int(df["distance_mi"].sum()),
    }
    with open(os.path.join(OUT_DIR, "stats.json"), "w") as f:
        json.dump(stats, f, indent=2)

    print(f"\n🎉 Génération terminée !")
    print(f"   Vols totaux    : {len(df):,}")
    print(f"   Opérés         : {operated:,}")
    print(f"   Annulés        : {cancelled:,} ({stats['cancellation_rate_pct']}%)")
    print(f"   Retardés       : {delayed:,}")
    print(f"   OTP global     : {stats['otp_rate_pct']}%")
    print(f"   Retard moy dep : {stats['avg_dep_delay_min']} min")
    print(f"   Routes         : {len(ROUTES)}")
