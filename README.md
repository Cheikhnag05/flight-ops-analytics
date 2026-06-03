<div align="center">

# ✈️ Flight Operations Performance Analytics

**6-Dashboard Aviation Intelligence System · Houston IAH & HOU · 2022–2026**

[![Live Demo](https://img.shields.io/badge/🛫_Live_Demo-Vercel-black?style=for-the-badge)](https://flight-ops-analytics.vercel.app)
[![API](https://img.shields.io/badge/⚡_API-Render-46E3B7?style=for-the-badge)](https://flight-ops-analytics.onrender.com/docs)
[![GitHub](https://img.shields.io/badge/GitHub-Cheikhnag05-181717?style=for-the-badge&logo=github)](https://github.com/Cheikhnag05/flight-ops-analytics)

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Pandas](https://img.shields.io/badge/pandas-2.x-150458?style=flat-square&logo=pandas)](https://pandas.pydata.org)

> 🏆 **Projet portfolio** — Reproduit et étend l'analyse de ponctualité 2M+ enregistrements  
> menée chez **Turkish Airlines**. Données BTS (Bureau of Transportation Statistics)  
> pour les aéroports **Houston IAH & HOU**. Design cockpit aviation exclusif.

</div>

---

## 🎯 En bref

Système d'analytics opérationnel complet pour la performance des vols, couvrant **206 000+ vols** sur 5 ans (2022–2026) à partir des aéroports de Houston. Reproduit la méthodologie d'analyse appliquée en production chez Turkish Airlines — on-time rates, turnaround efficiency, delay root-cause analysis — et l'enrichit avec 6 dashboards interactifs.

| 🔢 Indicateur | Valeur |
|---------------|--------|
| Vols analysés | **206,257** (format BTS) |
| Période | **2022 – 2026** (5 ans) |
| Aéroports | **IAH** (Bush Intercontinental) · **HOU** (Hobby) |
| Compagnies | **8** (UA, AA, WN, DL, B6, NK, F9, AS) |
| Routes couvertes | **28** (domestic + international) |
| OTP global | **81.56%** · Retard moyen : **6.58 min** |
| Dashboards | **6** (Flight Board · OTP · Delays · TAT · Routes · PAX) |

---

## 🚀 Demo en ligne

| Service | URL | Description |
|---------|-----|-------------|
| 🖥️ **Dashboard** | [flight-ops-analytics.vercel.app](https://flight-ops-analytics.vercel.app) | Interface cockpit React |
| ⚡ **API REST** | [flight-ops-analytics.onrender.com](https://flight-ops-analytics.onrender.com) | FastAPI · 10 endpoints |
| 📖 **API Docs** | [.../docs](https://flight-ops-analytics.onrender.com/docs) | Swagger UI interactif |

> ⚠️ API sur plan gratuit Render — première requête ~30 secondes si inactif.

---

## 🛫 Les 6 Dashboards

| Code | Dashboard | Description |
|------|-----------|-------------|
| **FB** | Flight Board | Vue ops temps réel — OTP trend, hourly delay pattern, KPIs instruments |
| **OTP** | On-Time Performance | Ranking compagnies, jauges OTP, benchmarks FAA/industrie |
| **DLY** | Delay Analysis | Root-cause BTS (carrier/weather/NAS/security/late aircraft) |
| **TAT** | Turnaround | Gate time, taxi-out, taxi-in, block time par compagnie |
| **RTE** | Routes | Distance vs delay scatter, top routes, worst OTP |
| **PAX** | Passenger Experience | Satisfaction proxy, reliability index, scorecard compagnies |

---

## 📊 KPIs & Métriques

| Métrique | Source BTS | Description |
|----------|-----------|-------------|
| **OTP Rate** | `arr_delay < 15min` | % vols à l'heure (standard FAA) |
| **Dep/Arr Delay** | BTS delay fields | Minutes de retard départ/arrivée |
| **Cancellation Rate** | `cancelled = 1` | % vols annulés |
| **Gate Turnaround** | Computed | Temps rotation porte à porte |
| **Taxi-Out Time** | `wheels_off - dep_time` | Temps roulage au départ |
| **Taxi-In Time** | `arr_time - wheels_on` | Temps roulage à l'arrivée |
| **Delay Cause** | BTS categories | Carrier/Weather/NAS/Security/Late Aircraft |
| **Satisfaction Score** | Proxy OTP+Cancel | Score composite expérience passager |

---

## 🛠️ Stack technique

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                                 │
├──────────────────┬──────────────────┬───────────────────────────┤
│   DATA LAYER     │   PIPELINE       │      SERVING LAYER        │
│                  │                  │                           │
│  pandas          │  BTS format      │  FastAPI + uvicorn        │
│  numpy           │  generate_data   │  10 REST endpoints        │
│  pyarrow         │  206K+ flights   │  CORS + Swagger           │
│  Parquet         │  IAH & HOU       │                           │
│  SQL-ready       │  2022–2026       │  React 18 + Vite          │
│                  │  8 airlines      │  Tailwind CSS (Cockpit)   │
│                  │                  │  Recharts + Leaflet       │
├──────────────────┴──────────────────┴───────────────────────────┤
│   DESIGN: Cockpit Aviation Theme · Cyan/Amber/Black · Monospace │
│   DEPLOY: GitHub → Render (API) + Vercel (Frontend)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Structure du projet

```
flight-ops-analytics/
│
├── 📁 api/
│   └── main.py                  ← FastAPI REST API (10 endpoints)
│
├── 📁 src/
│   └── generate_data.py         ← Générateur BTS format (206K+ vols)
│
├── 📁 sql/
│   └── queries.sql              ← Requêtes analytiques BigQuery-style
│
├── 📁 frontend/                 ← Dashboard React · Cockpit Theme
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx       ← Barre de nav horizontale cockpit
│       │   └── Shared.jsx       ← InstrumentCard, CockpitTooltip...
│       └── pages/
│           ├── FlightBoard.jsx  ← Tableau ops + OTP trend
│           ├── OTP.jsx          ← Jauges + ranking compagnies
│           ├── Delays.jsx       ← Root-cause BTS breakdown
│           ├── Turnaround.jsx   ← Gate TAT + taxi analysis
│           ├── Routes.jsx       ← Scatter distance vs delay
│           └── Passenger.jsx    ← Satisfaction proxy scorecard
│
└── 📁 data/raw/                 ← Données générées (Parquet + CSV)
    ├── flights.parquet          ← 206K vols (format BTS)
    ├── monthly_summary.parquet  ← Agrégats mensuels
    ├── delay_breakdown.parquet  ← Retards par cause
    ├── route_performance.parquet← Performance par route
    └── stats.json               ← Statistiques globales
```

---

## 📡 API Reference

```
GET  /              → Info API
GET  /health        → Statut + nombre de vols chargés
GET  /stats         → Statistiques globales dataset
GET  /overview      → KPIs agrégés (params: year, airport)
GET  /otp           → OTP mensuel (params: airport, carrier)
GET  /otp-by-airline→ OTP par compagnie (params: year, airport)
GET  /delays        → Retards mensuels (params: year, airport)
GET  /delays-by-cause → Root-cause breakdown (params: year, airport)
GET  /turnaround    → Rotation gate/taxi (param: airport)
GET  /routes        → Performance routes (params: airport, flight_type)
GET  /hourly-pattern→ Pattern horaire (params: year, airport)
GET  /trends        → Tendances annuelles (param: metric)
```

### Exemple `/overview?year=2026&airport=IAH`

```bash
curl "https://flight-ops-analytics.onrender.com/overview?year=2026&airport=IAH"
```

```json
{
  "year": 2026,
  "airport": "IAH",
  "total_flights": 142800,
  "operated_flights": 140627,
  "cancelled_flights": 2173,
  "delayed_flights": 26191,
  "otp_rate_pct": 81.38,
  "cancellation_rate_pct": 1.522,
  "avg_dep_delay_min": 28.4,
  "avg_turnaround_min": 44.8
}
```

### Exemple `/delays-by-cause?year=2026`

```bash
curl "https://flight-ops-analytics.onrender.com/delays-by-cause?year=2026"
```

```json
[
  {"delay_cause": "carrier",      "count": 14230, "avg_delay": 26.1, "pct": 38.0},
  {"delay_cause": "nas",          "count":  8230, "avg_delay": 19.8, "pct": 22.0},
  {"delay_cause": "late_aircraft","count":  7860, "avg_delay": 36.2, "pct": 21.0},
  {"delay_cause": "weather",      "count":  6740, "avg_delay": 44.7, "pct": 18.0},
  {"delay_cause": "security",     "count":   374, "avg_delay": 14.9, "pct":  1.0}
]
```

---

## ⚡ Lancer en local

```bash
# 1. Cloner
git clone https://github.com/Cheikhnag05/flight-ops-analytics.git
cd flight-ops-analytics

# 2. Installer Python
pip install fastapi uvicorn pandas pyarrow numpy

# 3. Générer les données (~3 min)
python src/generate_data.py

# 4. Lancer l'API
python -m uvicorn api.main:app --reload
# → http://localhost:8000/docs

# 5. Lancer le frontend (nouveau terminal)
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

---

## ✈️ Compagnies analysées

| Code | Compagnie | Hub | Type | Alliance |
|------|-----------|-----|------|---------|
| **UA** | United Airlines | IAH | Legacy | Star Alliance |
| **AA** | American Airlines | IAH | Legacy | oneworld |
| **WN** | Southwest Airlines | HOU | LCC | — |
| **DL** | Delta Air Lines | IAH | Legacy | SkyTeam |
| **B6** | JetBlue Airways | IAH | LCC | — |
| **NK** | Spirit Airlines | HOU | ULCC | — |
| **F9** | Frontier Airlines | HOU | ULCC | — |
| **AS** | Alaska Airlines | IAH | Legacy | oneworld |

---

## 🔗 Connexion avec l'expérience Turkish Airlines

Ce projet reproduit et étend la méthodologie utilisée lors d'une mission d'analyse de ponctualité chez Turkish Airlines :

| Chez Turkish Airlines | Ce projet |
|-----------------------|-----------|
| Données internes OTP (2M+ rows) | Données BTS publiques (206K rows) |
| SQL pipelines Oracle | FastAPI + pandas + Parquet |
| Looker Studio dashboards | React custom cockpit theme |
| Analyse retards par cause | Root-cause BTS (5 catégories) |
| Turnaround efficiency | Gate TAT + taxi-out + taxi-in |
| Rapports Excel hebdomadaires | Dashboard temps réel 24/7 |

---

## 👤 Auteur

**Cheikhna Dieng Gueye** — Data Analyst & ML Engineer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Cheikhna_Gueye-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/cheikhnagueye)
[![GitHub](https://img.shields.io/badge/GitHub-Cheikhnag05-181717?style=flat-square&logo=github)](https://github.com/Cheikhnag05)

> Expérience aviation chez **Turkish Airlines** · Data chez **Promobile, Dakar**  
> Expertise : SQL · Python · pandas · Aviation Analytics · Dashboard Design
