#!/usr/bin/env python3
"""
SuperLeap CRM — Supabase Seed Script
Generates realistic 6-month data from production patterns.
Outputs SQL files for batch execution.
"""

import random
import uuid
import json
from datetime import datetime, timedelta
import os

random.seed(42)  # Reproducible

# ============================================================
# CONSTANTS FROM PRODUCTION DATA
# ============================================================

KAMS = [
    {"id": "3656270b-918e-4333-8f04-a4b4cf9e7d44", "name": "Amit Verma", "city": "Gurugram", "region": "NCR", "team": "Alpha"},
    {"id": "a1b2c3d4-2222-4000-8000-000000000002", "name": "Priya Sharma", "city": "Delhi", "region": "NCR", "team": "Alpha"},
    {"id": "a1b2c3d4-3333-4000-8000-000000000003", "name": "Vikram Singh", "city": "Jaipur", "region": "North", "team": "Alpha"},
    {"id": "14edef99-b500-4101-a30d-ea863293d47e", "name": "Sneha Kapoor", "city": "Delhi", "region": "NCR", "team": "Beta"},
    {"id": "a1b2c3d4-4444-4000-8000-000000000004", "name": "Arjun Patel", "city": "Mumbai", "region": "West", "team": "Beta"},
    {"id": "a1b2c3d4-5555-4000-8000-000000000005", "name": "Deepika Nair", "city": "Bangalore", "region": "South", "team": "Beta"},
]

MAKES_MODELS = [
    ("MARUTI SUZUKI", ["Swift", "Wagon R 1.0", "Baleno", "Celerio", "Alto 800", "Dzire", "Vitara Brezza", "Ertiga"]),
    ("HYUNDAI", ["Creta", "i20", "i10", "Eon", "Venue", "Grand i10 Nios", "Verna", "Elite i20"]),
    ("HONDA", ["City", "Amaze", "Jazz", "WR-V", "Civic"]),
    ("TATA", ["Nexon", "Altroz", "Tiago", "Harrier", "Punch"]),
    ("TOYOTA", ["Innova Crysta", "Fortuner", "Glanza", "Urban Cruiser"]),
    ("MAHINDRA", ["XUV300", "Scorpio", "Bolero", "XUV700", "Thar"]),
    ("VOLKSWAGEN", ["Polo", "Vento", "Taigun"]),
    ("FORD", ["EcoSport", "Figo", "Aspire"]),
    ("RENAULT", ["Kwid", "Triber", "Kiger"]),
    ("KIA", ["Seltos", "Sonet", "Carens"]),
]
MAKE_WEIGHTS = [28, 23, 13, 7, 5, 5, 4, 3, 3, 3]

REGIONS = ["NCR", "North", "West", "South", "East"]
CITIES = {
    "NCR": ["Gurugram", "Delhi", "Noida", "Faridabad", "Ghaziabad"],
    "North": ["Jaipur", "Lucknow", "Chandigarh", "Ludhiana", "Agra"],
    "West": ["Mumbai", "Pune", "Ahmedabad", "Surat", "Nashik"],
    "South": ["Bangalore", "Chennai", "Hyderabad", "Kochi", "Coimbatore"],
    "East": ["Kolkata", "Patna", "Bhubaneswar", "Ranchi", "Guwahati"],
}

DEALER_NAMES_POOL = [
    "AUTO WORLD", "MOTOR XPERT", "PACIFIC MOTORS", "INDIAN AUTO LINKS", "HARSHIV ENTERPRISES",
    "OM FINANCIAL SERVICES", "ULTRA MOTORS", "SAMAN SAEED", "KASHMIR MOTORS", "SAHAJDEEP",
    "WHEEL BE ALRIGHT", "RM CAR STUDIO", "3M CARS", "VASHU AUTOMOBILES", "IQBAL CARS",
    "AM CARS", "HI-TECH AUTO", "COSSETPACK", "SHREE GAJANAND", "CARZO MOTORS",
    "SG CAR SALE", "MAX MARKETING", "AUTOKNOX", "ROYAL CAR BAZAR", "THE NATION OF CAR",
    "SIDHU MOTORS", "MOTORKARZ", "VS CAR SALES", "STAR AUTOMOBILES", "CITY WHEELS",
    "PRIME AUTO DEALS", "SUPER CARS HUB", "METRO MOTORS", "GOLDEN WHEELS", "ACE AUTO",
    "PIONEER MOTORS", "APEX CAR ZONE", "SWIFT AUTOS", "EAGLE MOTORS", "SILVER LINE CARS",
    "DIAMOND AUTO", "FORTUNE WHEELS", "KINGS AUTO", "PLATINUM MOTORS", "SUNRISE CARS",
    "VICTORY MOTORS", "CROWN AUTO", "GLOBAL CARS", "NATIONAL MOTORS", "PRESTIGE AUTO",
    "PREMIER WHEELS", "CLASSIC CARS", "ELITE MOTORS", "MAJESTIC AUTO", "CRYSTAL CARS",
    "SPARK MOTORS", "ZENITH AUTO", "INFINITY CARS", "ORBIT MOTORS", "SUMMIT AUTO",
    "NEXUS CARS", "VERTEX MOTORS", "PULSE AUTO", "GENESIS CARS", "TITAN MOTORS",
    "NOVA AUTO", "CREST CARS", "HORIZON MOTORS", "VELOCITY AUTO", "ATLAS CARS",
]

MONTHS = [
    ("2025-10", 31), ("2025-11", 30), ("2025-12", 31),
    ("2026-01", 31), ("2026-02", 28), ("2026-03", 31),
]

# Lead volume per month (growing)
LEADS_PER_MONTH = [500, 560, 620, 700, 770, 850]  # ~4000 total

# ============================================================
# HELPERS
# ============================================================

def esc(s):
    if s is None:
        return "NULL"
    s = str(s).replace("'", "''")
    return f"'{s}'"

def esc_num(n):
    return str(n) if n is not None else "NULL"

def esc_bool(b):
    return "true" if b else "false"

def esc_ts(dt):
    if dt is None:
        return "NULL"
    return f"'{dt.strftime('%Y-%m-%d %H:%M:%S')}'"

def rand_date_in_month(year, month, max_day):
    day = random.randint(1, max_day)
    hour = random.randint(8, 18)
    minute = random.randint(0, 59)
    return datetime(year, month, day, hour, minute, 0)

def random_price(low, high):
    # Generate realistic-ish prices (round to nearest 1000)
    return round(random.uniform(low, high) / 1000) * 1000

def pick_make_model():
    make_idx = random.choices(range(len(MAKES_MODELS)), weights=MAKE_WEIGHTS, k=1)[0]
    make, models = MAKES_MODELS[make_idx]
    model = random.choice(models)
    return make, model

def random_phone():
    return f"+91{random.randint(7000000000, 9999999999)}"

def random_name():
    first = random.choice(["Rajesh", "Suresh", "Anil", "Mohan", "Ravi", "Sanjay", "Ajay",
                           "Priya", "Neha", "Pooja", "Sneha", "Anita", "Kavita", "Sunita",
                           "Amit", "Vikas", "Rahul", "Vikram", "Rohit", "Manish", "Deepak",
                           "Meera", "Geeta", "Rekha", "Suman", "Lakshmi", "Divya", "Anjali"])
    last = random.choice(["Kumar", "Sharma", "Singh", "Verma", "Gupta", "Yadav", "Joshi",
                          "Patel", "Shah", "Mehta", "Nair", "Iyer", "Reddy", "Rao",
                          "Mishra", "Dubey", "Tiwari", "Pandey", "Chauhan", "Thakur"])
    return f"{first} {last}"


# ============================================================
# GENERATE DEALERS (400)
# ============================================================

def generate_dealers():
    dealers = []
    dealer_idx = 0
    for kam in KAMS:
        num_dealers = random.randint(60, 72)
        kam_region = kam["region"]
        for i in range(num_dealers):
            dealer_idx += 1
            dealer_id = str(uuid.uuid4())
            dealer_code = str(130000 + dealer_idx)

            # 70% same region as KAM, 30% nearby
            if random.random() < 0.7:
                region = kam_region
            else:
                region = random.choice(REGIONS)

            city = random.choice(CITIES[region])

            name_base = random.choice(DEALER_NAMES_POOL)
            name = f"{name_base} {city[:3].upper()}" if random.random() < 0.3 else name_base
            # Ensure uniqueness
            name = f"{name} {dealer_code[-3:]}"

            segment = random.choices(
                ["Diamond", "Gold", "Silver", "Bronze"],
                weights=[10, 20, 30, 40], k=1
            )[0]

            tags = []
            if random.random() < 0.30:
                tags.append("DCF Onboarded")
            if segment in ("Diamond", "Gold") and random.random() < 0.5:
                tags.append("Top Dealer")

            # GPS coords around Indian cities
            base_coords = {
                "NCR": (28.45, 77.02), "North": (26.9, 75.8), "West": (19.07, 72.87),
                "South": (12.97, 77.59), "East": (22.57, 88.36)
            }
            base_lat, base_lng = base_coords[region]
            lat = round(base_lat + random.uniform(-0.3, 0.3), 6)
            lng = round(base_lng + random.uniform(-0.3, 0.3), 6)

            onboarded = datetime(2025, random.randint(1, 9), random.randint(1, 28))

            dealers.append({
                "dealer_id": dealer_id,
                "dealer_name": name,
                "dealer_code": dealer_code,
                "phone": random_phone(),
                "contact_person": random_name(),
                "city": city,
                "region": region,
                "segment": segment,
                "segment_tags": tags,
                "assigned_kam_id": kam["id"],
                "lat": lat,
                "lng": lng,
                "onboarded_at": onboarded,
                "kam_name": kam["name"],
            })
    return dealers


# ============================================================
# GENERATE LEADS (4000)
# ============================================================

def generate_leads(dealers):
    leads = []

    for month_idx, (month_str, max_day) in enumerate(MONTHS):
        year = int(month_str[:4])
        month = int(month_str[5:])
        num_leads = LEADS_PER_MONTH[month_idx]

        for _ in range(num_leads):
            dealer = random.choice(dealers)
            kam_id = dealer["assigned_kam_id"]
            kam = next(k for k in KAMS if k["id"] == kam_id)

            lead_id = str(uuid.uuid4())
            make, model = pick_make_model()
            car_year = random.choices(
                list(range(2010, 2026)),
                weights=[3, 5, 4, 2, 3, 5, 5, 6, 4, 3, 2, 5, 4, 4, 2, 1], k=1
            )[0]

            # Channel distribution: NGS 60%, GS 20%, DCF 20%
            channel = random.choices(["NGS", "GS", "DCF"], weights=[60, 20, 20], k=1)[0]

            lead_date = rand_date_in_month(year, month, max_day)
            deal_creation = lead_date + timedelta(hours=random.randint(0, 24))

            # Pricing
            cep = random_price(80000, 1500000)
            c24q = round(cep * random.uniform(0.75, 1.15) / 1000) * 1000 if random.random() < 0.6 else None
            max_c24 = c24q if c24q else None

            gs_flag = channel == "GS"
            lead_type = "Seller" if random.random() < 0.996 else "Inventory"

            # Funnel progression based on production rates
            # Lead → Appointment: 80%
            appointment_date = None
            current_appt = None
            inspection_date = None
            token_date = None
            stockin_date = None
            stockout_date = None
            appointment_status = None
            status = "open"

            has_appointment = random.random() < 0.80
            if has_appointment:
                appointment_date = lead_date + timedelta(days=random.randint(1, 5))
                current_appt = appointment_date
                if random.random() < 0.15:  # 15% reschedule
                    current_appt = appointment_date + timedelta(days=random.randint(1, 3))

                # Appointment → Inspection: 53% (42.4/80)
                has_inspection = random.random() < 0.53
                if has_inspection:
                    inspection_date = current_appt + timedelta(hours=random.randint(0, 48))
                    appointment_status = "INSPECTED"

                    # Inspection → Token: 13.7% of total
                    has_token = random.random() < 0.17
                    if has_token:
                        token_date = inspection_date + timedelta(days=random.randint(1, 7))

                        # Token → Stockin: 82.8%
                        has_stockin = random.random() < 0.83
                        if has_stockin:
                            stockin_date = token_date + timedelta(days=random.randint(0, 3))
                            status = "won"

                            # Stockin → Stockout: 91.7%
                            if random.random() < 0.917:
                                stockout_date = stockin_date + timedelta(days=random.randint(1, 14))
                else:
                    # No inspection
                    if random.random() < 0.3:
                        appointment_status = "CANCELLED"
                        if random.random() < 0.5:
                            status = "lost"
                    elif random.random() < 0.5:
                        appointment_status = "CONFIRMED"
                    else:
                        appointment_status = "BOOKED"

            # Some leads go lost without appointment
            if not has_appointment and random.random() < 0.15:
                status = "lost"

            bid_amount = round(cep * random.uniform(0.8, 1.0) / 1000) * 1000 if inspection_date and random.random() < 0.5 else None
            seller_agreed = round(cep * random.uniform(0.85, 1.05) / 1000) * 1000 if stockin_date else None

            ocb_count = 0
            if inspection_date:
                ocb_count = random.choices([0, 1, 2, 3, 4, 5], weights=[50, 20, 12, 8, 5, 3], k=1)[0]

            reg_no = f"{random.choice(['DL', 'HR', 'UP', 'MH', 'KA', 'TN', 'RJ', 'GJ'])}{random.randint(1,99):02d}{random.choice('ABCDEFGH')}{random.choice('ABCDEFGH')}{random.randint(1000,9999)}"

            leads.append({
                "lead_id": lead_id,
                "channel": channel,
                "lead_type": lead_type,
                "status": status,
                "customer_name": random_name(),
                "customer_phone": random_phone(),
                "reg_no": reg_no,
                "make": make,
                "model": model,
                "variant": "",
                "year": car_year,
                "dealer_id": dealer["dealer_id"],
                "dealer_code": dealer["dealer_code"],
                "dealer_name": dealer["dealer_name"],
                "dealer_region": dealer["region"],
                "assigned_kam_id": kam_id,
                "kam_name": kam["name"],
                "lead_date": lead_date,
                "deal_creation_date": deal_creation,
                "appointment_date": appointment_date,
                "current_appt_date": current_appt,
                "inspection_date": inspection_date,
                "token_date": token_date,
                "stockin_date": stockin_date,
                "stockout_date": stockout_date,
                "cep": cep,
                "latest_c24_quote": c24q,
                "max_c24_quote": max_c24,
                "bid_amount": bid_amount,
                "seller_agreed_price": seller_agreed,
                "appointment_status": appointment_status,
                "gs_flag": gs_flag,
                "franchise_flag": random.random() < 0.22,
                "ocb_run_count": ocb_count,
                "rag": random.choices(["green", "amber", "red"], weights=[60, 25, 15], k=1)[0],
                "city": dealer["city"],
                "inspection_city": dealer["city"] if inspection_date else None,
                "inspection_region": dealer["region"] if inspection_date else None,
                "verified": "yes" if random.random() < 0.9 else "no",
            })

    return leads


# ============================================================
# GENERATE DCF CASES (600)
# ============================================================

def generate_dcf_cases(dealers):
    dcf_dealers = [d for d in dealers if "DCF Onboarded" in d.get("segment_tags", [])]
    if len(dcf_dealers) < 50:
        dcf_dealers = dealers[:100]  # fallback

    cases = []
    case_num = 1000040000

    for month_idx, (month_str, max_day) in enumerate(MONTHS):
        year = int(month_str[:4])
        month = int(month_str[5:])
        # Growing: ~70, 80, 90, 100, 120, 140
        num_cases = [70, 80, 90, 100, 120, 140][month_idx]

        for _ in range(num_cases):
            case_num += 1
            dealer = random.choice(dcf_dealers)
            dcf_lead_id = f"UCD{case_num}"

            lead_date = rand_date_in_month(year, month, max_day)

            # DCF funnel: Lead → Login (35%) → Approval (21%) → Disbursal (15%)
            login_date = None
            approval_date = None
            disbursal_date = None
            rejection_reason = None

            funnel_states = [
                "SOURCING | BASIC_DETAILS", "SOURCING | PA_OFFER", "SOURCING | BANKING",
                "CREDIT | CREDIT_INITIATED", "CREDIT | UNDERWRITING", "RISK | RCU",
                "CONVERSION | TNC_PENDING", "CONVERSION | TNC_ACCEPTANCE", "DISBURSAL | DISBURSAL"
            ]

            # Determine how far this case progresses
            progress = random.random()
            if progress < 0.35:
                # Stuck in sourcing
                funnel_state = random.choice(funnel_states[:3])
            elif progress < 0.60:
                # Reached credit/risk
                login_date = lead_date + timedelta(days=random.randint(1, 10))
                funnel_state = random.choice(funnel_states[3:6])
            elif progress < 0.78:
                # Reached conversion (approved)
                login_date = lead_date + timedelta(days=random.randint(1, 7))
                approval_date = login_date + timedelta(days=random.randint(2, 14))
                funnel_state = random.choice(funnel_states[6:8])
            elif progress < 0.85:
                # Rejected
                login_date = lead_date + timedelta(days=random.randint(1, 7))
                rejection_reason = random.choice(["Low CIBIL", "Income insufficient", "Document mismatch", "Age criteria", "Vehicle criteria"])
                funnel_state = random.choice(funnel_states[3:6])
            else:
                # Disbursed
                login_date = lead_date + timedelta(days=random.randint(1, 5))
                approval_date = login_date + timedelta(days=random.randint(2, 10))
                disbursal_date = approval_date + timedelta(days=random.randint(1, 7))
                funnel_state = "DISBURSAL | DISBURSAL"

            valuation = random_price(70000, 2900000)
            ltv_pct = random.uniform(55, 100)
            loan_amount = round(valuation * ltv_pct / 100 / 1000) * 1000
            tenure = random.choice([24, 36, 48, 60, 72])
            pf = round(loan_amount * random.uniform(0.02, 0.04) / 100) * 100

            make, model = pick_make_model()

            lender = random.choices(
                ["Cars24", "CARS24_CL", "Mahindra", "AU", "IDFC"],
                weights=[44, 32, 20, 2, 2], k=1
            )[0] if approval_date else None

            cases.append({
                "dcf_lead_id": dcf_lead_id,
                "customer_name": random_name(),
                "customer_phone": random_phone(),
                "registration_no": f"{random.choice(['DL', 'HR', 'MH', 'KA'])}{random.randint(1,99):02d}{random.choice('ABCDEFGH')}{random.choice('ABCDEFGH')}{random.randint(1000,9999)}",
                "make": make,
                "model": model,
                "year": random.randint(2012, 2024),
                "fuel_type": random.choice(["Petrol", "Diesel", "CNG"]),
                "valuation_price": valuation,
                "dealer_id": dealer["dealer_id"],
                "dealer_code": dealer["dealer_code"],
                "dealer_name": dealer["dealer_name"],
                "dealer_city": dealer["city"],
                "lead_creation_date": lead_date,
                "login_date": login_date,
                "approval_date": approval_date,
                "disbursal_date": disbursal_date,
                "system_ltv": round(ltv_pct, 1),
                "final_offer_ltv": round(ltv_pct * random.uniform(0.8, 1.0), 1),
                "total_loan_sanction": loan_amount if approval_date else None,
                "loan_tenure": tenure,
                "roi_per_annum": round(random.uniform(12, 18), 2),
                "pf_amount": pf if approval_date else None,
                "gross_disbursal": loan_amount if disbursal_date else None,
                "cibil_score": random.randint(550, 850),
                "employment_details": random.choice(["Salaried", "Self-Employed", "Business"]),
                "red_flag": random.random() < 0.29,
                "banking_flag": random.choice(["COMPLETED", None, None]),
                "case_status": "Active",
                "funnel_loan_state": funnel_state,
                "hpa_status": lender,
                "source": random.choices(["DIY", "Agent"], weights=[95, 5], k=1)[0],
                "platform_type": random.choices(["MILES", "DEALER_APP"], weights=[84, 16], k=1)[0],
                "entry_point": random.choices(["LEAD_CREATION", "DEALER_CIBIL"], weights=[90, 10], k=1)[0],
                "onboard": "Active",
                "rejection_reason": rejection_reason,
                "region": dealer["region"],
                "first_disbursal_for_dealer": disbursal_date is not None and random.random() < 0.15,
            })

    return cases


# ============================================================
# GENERATE CALLS & VISITS
# ============================================================

def generate_calls(dealers, leads):
    calls = []
    dealer_by_kam = {}
    for d in dealers:
        kam_id = d["assigned_kam_id"]
        dealer_by_kam.setdefault(kam_id, []).append(d)

    for month_idx, (month_str, max_day) in enumerate(MONTHS):
        year = int(month_str[:4])
        month = int(month_str[5:])

        for kam in KAMS:
            kam_dealers = dealer_by_kam.get(kam["id"], [])
            num_calls = random.randint(185, 215)  # ~200/month

            for _ in range(num_calls):
                dealer = random.choice(kam_dealers) if kam_dealers else random.choice(dealers)
                call_date = rand_date_in_month(year, month, max_day)
                duration = random.choices(
                    [0, random.randint(10, 30), random.randint(30, 120), random.randint(120, 480), random.randint(480, 900)],
                    weights=[15, 15, 30, 30, 10], k=1
                )[0]
                is_productive = duration > 30
                outcome = "Connected" if is_productive else random.choice(["Not Connected", "Busy", "Switched Off", "No Answer"])

                calls.append({
                    "dealer_id": dealer["dealer_id"],
                    "kam_id": kam["id"],
                    "customer_phone": random_phone(),
                    "direction": "outbound",
                    "start_time": call_date,
                    "end_time": call_date + timedelta(seconds=duration),
                    "duration": duration,
                    "outcome": outcome,
                    "is_productive": is_productive,
                })

    return calls


def generate_visits(dealers):
    visits = []
    dealer_by_kam = {}
    for d in dealers:
        kam_id = d["assigned_kam_id"]
        dealer_by_kam.setdefault(kam_id, []).append(d)

    for month_idx, (month_str, max_day) in enumerate(MONTHS):
        year = int(month_str[:4])
        month = int(month_str[5:])

        for kam in KAMS:
            kam_dealers = dealer_by_kam.get(kam["id"], [])
            num_visits = random.randint(140, 160)  # ~150/month

            for _ in range(num_visits):
                dealer = random.choice(kam_dealers) if kam_dealers else random.choice(dealers)
                visit_date = rand_date_in_month(year, month, max_day)

                is_completed = random.random() < 0.80
                status = "completed" if is_completed else random.choice(["cancelled", "no_show", "scheduled"])
                duration = random.randint(15, 90) if is_completed else None

                dist = random.randint(10, 500) if is_completed else None
                check_in = visit_date if is_completed else None
                check_out = visit_date + timedelta(minutes=duration) if is_completed and duration else None

                visits.append({
                    "dealer_id": dealer["dealer_id"],
                    "kam_id": kam["id"],
                    "scheduled_at": visit_date,
                    "visit_type": random.choice(["Planned", "Unplanned"]),
                    "status": status,
                    "is_productive": is_completed,
                    "geo_lat": dealer["lat"] + random.uniform(-0.001, 0.001) if is_completed else None,
                    "geo_lng": dealer["lng"] + random.uniform(-0.001, 0.001) if is_completed else None,
                    "check_in_at": check_in,
                    "check_out_at": check_out,
                    "duration_minutes": duration,
                    "distance_from_dealer": dist,
                })

    return visits


# ============================================================
# GENERATE SQL
# ============================================================

def dealers_to_sql(dealers, batch_size=50):
    batches = []
    for i in range(0, len(dealers), batch_size):
        batch = dealers[i:i+batch_size]
        values = []
        for d in batch:
            tags_sql = "ARRAY[" + ",".join(esc(t) for t in d["segment_tags"]) + "]::text[]" if d["segment_tags"] else "'{}'::text[]"
            values.append(f"""({esc(d['dealer_id'])}, {esc(d['dealer_name'])}, {esc(d['dealer_code'])}, {esc(d['phone'])}, {esc(d['contact_person'])}, {esc(d['city'])}, {esc(d['region'])}, {esc(d['segment'])}, {tags_sql}, {esc(d['assigned_kam_id'])}, 'active', {d['lat']}, {d['lng']}, {esc_ts(d['onboarded_at'])}, '{{}}'::jsonb, now(), now())""")
        sql = f"""INSERT INTO dealers (dealer_id, dealer_name, dealer_code, phone, contact_person, city, region, segment, segment_tags, assigned_kam_id, status, lat, lng, onboarded_at, metadata, created_at, updated_at) VALUES\n{','.join(values)};"""
        batches.append(sql)
    return batches


def leads_to_sql(leads, batch_size=100):
    batches = []
    for i in range(0, len(leads), batch_size):
        batch = leads[i:i+batch_size]
        values = []
        for l in batch:
            values.append(f"""({esc(l['lead_id'])}, {esc(l['channel'])}, {esc(l['lead_type'])}, {esc(l['status'])}, {esc(l['customer_name'])}, {esc(l['customer_phone'])}, {esc(l['reg_no'])}, {esc(l['make'])}, {esc(l['model'])}, {esc(l['variant'])}, {esc_num(l['year'])}, {esc(l['dealer_id'])}, {esc(l['dealer_code'])}, {esc(l['dealer_name'])}, {esc(l['dealer_region'])}, {esc(l['assigned_kam_id'])}, {esc(l['kam_name'])}, {esc_ts(l['lead_date'])}, {esc_ts(l['deal_creation_date'])}, {esc_ts(l['appointment_date'])}, {esc_ts(l['current_appt_date'])}, {esc_ts(l['inspection_date'])}, {esc_ts(l['token_date'])}, {esc_ts(l['stockin_date'])}, {esc_ts(l['stockout_date'])}, {esc_num(l['cep'])}, {esc_num(l['latest_c24_quote'])}, {esc_num(l['max_c24_quote'])}, {esc_num(l['bid_amount'])}, {esc_num(l['seller_agreed_price'])}, {esc(l['appointment_status'])}, {esc_bool(l['gs_flag'])}, {esc_bool(l['franchise_flag'])}, {esc_num(l['ocb_run_count'])}, {esc(l['rag'])}, {esc(l['city'])}, {esc(l['inspection_city'])}, {esc(l['inspection_region'])}, {esc(l['verified'])})""")
        sql = f"""INSERT INTO leads (lead_id, channel, lead_type, status, customer_name, customer_phone, reg_no, make, model, variant, year, dealer_id, dealer_code, dealer_name, dealer_region, assigned_kam_id, kam_name, lead_date, deal_creation_date, appointment_date, current_appt_date, inspection_date, token_date, stockin_date, stockout_date, cep, latest_c24_quote, max_c24_quote, bid_amount, seller_agreed_price, appointment_status, gs_flag, franchise_flag, ocb_run_count, rag, city, inspection_city, inspection_region, verified) VALUES\n{','.join(values)};"""
        batches.append(sql)
    return batches


def dcf_to_sql(cases, batch_size=50):
    batches = []
    for i in range(0, len(cases), batch_size):
        batch = cases[i:i+batch_size]
        values = []
        for c in batch:
            values.append(f"""({esc(c['dcf_lead_id'])}, {esc(c['customer_name'])}, {esc(c['customer_phone'])}, {esc(c['registration_no'])}, {esc(c['make'])}, {esc(c['model'])}, {esc_num(c['year'])}, {esc(c['fuel_type'])}, {esc_num(c['valuation_price'])}, {esc(c['dealer_id'])}, {esc(c['dealer_code'])}, {esc(c['dealer_name'])}, {esc(c['dealer_city'])}, {esc_ts(c['lead_creation_date'])}, {esc_ts(c['login_date'])}, {esc_ts(c['approval_date'])}, {esc_ts(c['disbursal_date'])}, {esc_num(c['system_ltv'])}, {esc_num(c['final_offer_ltv'])}, {esc_num(c['total_loan_sanction'])}, {esc_num(c['loan_tenure'])}, {esc_num(c['roi_per_annum'])}, {esc_num(c['pf_amount'])}, {esc_num(c['gross_disbursal'])}, {esc_num(c['cibil_score'])}, {esc(c['employment_details'])}, {esc_bool(c['red_flag'])}, {esc(c['banking_flag'])}, {esc(c['case_status'])}, {esc(c['funnel_loan_state'])}, {esc(c['hpa_status'])}, {esc(c['source'])}, {esc(c['platform_type'])}, {esc(c['entry_point'])}, {esc(c['onboard'])}, {esc(c['rejection_reason'])}, {esc(c['region'])}, {esc_bool(c['first_disbursal_for_dealer'])})""")
        sql = f"""INSERT INTO dcf_cases (dcf_lead_id, customer_name, customer_phone, registration_no, make, model, year, fuel_type, valuation_price, dealer_id, dealer_code, dealer_name, dealer_city, lead_creation_date, login_date, approval_date, disbursal_date, system_ltv, final_offer_ltv, total_loan_sanction, loan_tenure, roi_per_annum, pf_amount, gross_disbursal, cibil_score, employment_details, red_flag, banking_flag, case_status, funnel_loan_state, hpa_status, source, platform_type, entry_point, onboard, rejection_reason, region, first_disbursal_for_dealer) VALUES\n{','.join(values)};"""
        batches.append(sql)
    return batches


def calls_to_sql(calls, batch_size=200):
    batches = []
    for i in range(0, len(calls), batch_size):
        batch = calls[i:i+batch_size]
        values = []
        for c in batch:
            values.append(f"""({esc(c['dealer_id'])}, {esc(c['kam_id'])}, {esc(c['customer_phone'])}, {esc(c['direction'])}, {esc_ts(c['start_time'])}, {esc_ts(c['end_time'])}, {esc_num(c['duration'])}, {esc(c['outcome'])}, {esc_bool(c['is_productive'])})""")
        sql = f"""INSERT INTO call_events (dealer_id, kam_id, customer_phone, direction, start_time, end_time, duration, outcome, is_productive) VALUES\n{','.join(values)};"""
        batches.append(sql)
    return batches


def visits_to_sql(visits, batch_size=200):
    batches = []
    for i in range(0, len(visits), batch_size):
        batch = visits[i:i+batch_size]
        values = []
        for v in batch:
            values.append(f"""({esc(v['dealer_id'])}, {esc(v['kam_id'])}, {esc_ts(v['scheduled_at'])}, {esc(v['visit_type'])}, {esc(v['status'])}, {esc_bool(v['is_productive'])}, {esc_num(v['geo_lat'])}, {esc_num(v['geo_lng'])}, {esc_ts(v['check_in_at'])}, {esc_ts(v['check_out_at'])}, {esc_num(v['duration_minutes'])}, {esc_num(v['distance_from_dealer'])})""")
        sql = f"""INSERT INTO visits (dealer_id, kam_id, scheduled_at, visit_type, status, is_productive, geo_lat, geo_lng, check_in_at, check_out_at, duration_minutes, distance_from_dealer) VALUES\n{','.join(values)};"""
        batches.append(sql)
    return batches


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), "seed_sql")
    os.makedirs(output_dir, exist_ok=True)

    print("Generating dealers...")
    dealers = generate_dealers()
    print(f"  {len(dealers)} dealers")

    print("Generating leads...")
    leads = generate_leads(dealers)
    print(f"  {len(leads)} leads")

    print("Generating DCF cases...")
    dcf = generate_dcf_cases(dealers)
    print(f"  {len(dcf)} DCF cases")

    print("Generating calls...")
    calls = generate_calls(dealers, leads)
    print(f"  {len(calls)} calls")

    print("Generating visits...")
    visits = generate_visits(dealers)
    print(f"  {len(visits)} visits")

    print("\nWriting SQL files...")

    dealer_batches = dealers_to_sql(dealers)
    for i, sql in enumerate(dealer_batches):
        with open(os.path.join(output_dir, f"01_dealers_{i:03d}.sql"), "w") as f:
            f.write(sql)

    lead_batches = leads_to_sql(leads)
    for i, sql in enumerate(lead_batches):
        with open(os.path.join(output_dir, f"02_leads_{i:03d}.sql"), "w") as f:
            f.write(sql)

    dcf_batches = dcf_to_sql(dcf)
    for i, sql in enumerate(dcf_batches):
        with open(os.path.join(output_dir, f"03_dcf_{i:03d}.sql"), "w") as f:
            f.write(sql)

    call_batches = calls_to_sql(calls)
    for i, sql in enumerate(call_batches):
        with open(os.path.join(output_dir, f"04_calls_{i:03d}.sql"), "w") as f:
            f.write(sql)

    visit_batches = visits_to_sql(visits)
    for i, sql in enumerate(visit_batches):
        with open(os.path.join(output_dir, f"05_visits_{i:03d}.sql"), "w") as f:
            f.write(sql)

    # Summary
    total_files = len(dealer_batches) + len(lead_batches) + len(dcf_batches) + len(call_batches) + len(visit_batches)
    print(f"\n{total_files} SQL files written to {output_dir}/")
    print(f"Dealers: {len(dealers)}, Leads: {len(leads)}, DCF: {len(dcf)}, Calls: {len(calls)}, Visits: {len(visits)}")
