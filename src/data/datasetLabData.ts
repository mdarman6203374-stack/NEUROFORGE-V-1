export interface SampleDatasetSpec {
  id: string;
  name: string;
  hinglishName: string;
  filename: string;
  targetColumn: string;
  leakageColumns: string[];
  idColumns: string[];
  description: string;
  hinglishDescription: string;
  leakageExplanation: string;
  hinglishLeakageExplanation: string;
  csvText: string;
  buggyStarterCode: string;
  cleanStarterCode: string;
  verificationTests: string[];
  testHarnessCode: string;
}

export const SAMPLE_MESSY_DATASETS: SampleDatasetSpec[] = [
  {
    id: 'loan-risk',
    name: 'Loan Default Risk (Missing Income, Outliers & Post-Event Leakage)',
    hinglishName: 'Loan Default Risk (Missing Values, Salary Outliers & Leakage Trap)',
    filename: 'loan_risk_messy.csv',
    targetColumn: 'defaulted',
    leakageColumns: ['recovery_fee_charged'],
    idColumns: ['loan_id'],
    description:
      'Predict whether a borrower defaults on a loan. Contains NaN incomes, extreme income outliers (9.5M), duplicate rows, a skewed target (~20% defaults), and a hidden post-default column.',
    hinglishDescription:
      'Borrower loan default predict karein. Isme missing incomes, extreme salary outliers (95 lakh), duplicate rows, skewed target (~20% default), aur ek hidden future leakage column hai.',
    leakageExplanation:
      'recovery_fee_charged is ONLY recorded after a borrower has already defaulted (target leakage). Also, normalizing annual_income before train_test_split leaks test-set salary outliers into train mean/std!',
    hinglishLeakageExplanation:
      'recovery_fee_charged sirf tab lagta hai jab user ALREADY default kar chuka ho (100% future leakage!). Saath hi split se pehle scaler fit karne se test outliers ka mean/std train mein leak ho jata hai.',
    csvText: `loan_id,annual_income,credit_score,debt_to_income,recovery_fee_charged,defaulted
L101,62000,710,0.22,0,0
L102,48000,640,0.41,0,0
L103,,590,0.58,1450,1
L104,75000,745,0.18,0,0
L105,9500000,695,0.29,0,0
L106,39000,560,0.67,2100,1
L107,54000,680,0.33,0,0
L107,54000,680,0.33,0,0
L108,,720,0.21,0,0
L109,43000,575,0.61,1800,1
L110,88000,760,0.15,0,0
L111,51000,655,0.38,0,0
L112,35000,540,0.72,2650,1
L113,67000,705,0.25,0,0
L114,8200000,610,0.49,0,0
L115,46000,625,0.44,0,0
L116,59000,690,0.31,0,0
L117,41000,550,0.64,1950,1
L118,71000,730,0.20,0,0
L119,,670,0.36,0,0`,
    buggyStarterCode: `import csv, io
import numpy as np

# BUGGY PIPELINE: Spot why this leaks test data and target information!
rows = list(csv.DictReader(io.StringIO(DATASET_CSV)))
# Bug 1: Didn't drop duplicate loan_id or target-leakage column 'recovery_fee_charged'
incomes = [float(r['annual_income']) for r in rows if r['annual_income'] != '']
global_mean = np.mean(incomes) # Bug 2: Global mean includes extreme 9.5M outliers + test split!

X, y = [], []
for r in rows:
    inc = float(r['annual_income']) if r['annual_income'] else global_mean
    X.append([inc, float(r['credit_score']), float(r['debt_to_income']), float(r['recovery_fee_charged'])])
    y.append(int(r['defaulted']))

X = np.array(X, dtype=float)
# Bug 3: Global z-score BEFORE train/test split!
X = (X - X.mean(axis=0)) / (X.std(axis=0) + 1e-8)
print("BUGGY features shape:", X.shape)
print("Leakage issue: Test outliers warped train scaling & recovery_fee_charged predicts the past!")`,
    cleanStarterCode: `import csv, io
import numpy as np

def build_clean_splits(csv_text: str):
    rows = list(csv.DictReader(io.StringIO(csv_text)))

    # 1. Deduplicate by loan_id BEFORE splitting
    seen_ids = set()
    deduped = []
    for r in rows:
        lid = r['loan_id'].strip()
        if lid not in seen_ids:
            seen_ids.add(lid)
            deduped.append(r)

    # 2. Drop ID ('loan_id') & future-leakage column ('recovery_fee_charged')
    feature_cols = ['annual_income', 'credit_score', 'debt_to_income']

    # 3. Deterministic stratified-style split (80% train / 20% test by class)
    pos = [r for r in deduped if int(r['defaulted']) == 1]
    neg = [r for r in deduped if int(r['defaulted']) == 0]
    train_rows = pos[:max(1, int(len(pos) * 0.8))] + neg[:max(1, int(len(neg) * 0.8))]
    test_rows = pos[max(1, int(len(pos) * 0.8)):] + neg[max(1, int(len(neg) * 0.8)):]

    # 4. Fit median imputer & IQR clipping bounds STRICTLY on train_rows
    train_incomes = np.array([float(r['annual_income']) for r in train_rows if r['annual_income'] != ''])
    train_median_income = float(np.median(train_incomes))
    q1, q3 = np.percentile(train_incomes, [25, 75])
    iqr = q3 - q1
    lower_bound, upper_bound = q1 - 1.5 * iqr, q3 + 1.5 * iqr

    def extract_raw(row_list):
        mat = []
        for r in row_list:
            inc = float(r['annual_income']) if r['annual_income'] != '' else train_median_income
            inc = float(np.clip(inc, lower_bound, upper_bound))
            mat.append([inc, float(r['credit_score']), float(r['debt_to_income'])])
        return np.array(mat, dtype=float), np.array([int(r['defaulted']) for r in row_list], dtype=int)

    X_train_raw, y_train = extract_raw(train_rows)
    X_test_raw, y_test = extract_raw(test_rows)

    # 5. Fit StandardScaler strictly on X_train_raw, apply to both
    mu = X_train_raw.mean(axis=0)
    sigma = np.where(X_train_raw.std(axis=0) == 0, 1.0, X_train_raw.std(axis=0))
    X_train = (X_train_raw - mu) / sigma
    X_test = (X_test_raw - mu) / sigma

    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "dropped_cols": ["loan_id", "recovery_fee_charged"],
        "deduped_count": len(deduped),
        "upper_income_cap": upper_bound,
    }

result = build_clean_splits(DATASET_CSV)
print("Deduplicated rows:", result["deduped_count"])
print("Dropped leakage/ID cols:", result["dropped_cols"])
print("Train shape:", result["X_train"].shape, "| Test shape:", result["X_test"].shape)
print("Train outlier income cap:", round(result["upper_income_cap"], 2))
print("Zero NaNs check:", not (np.isnan(result["X_train"]).any() or np.isnan(result["X_test"]).any()))`,
    verificationTests: [
      'Deduplicated rows before splitting (19 unique rows)',
      'Dropped leakage column (recovery_fee_charged) -> 3 clean features',
      'Zero NaN values remain in X_train and X_test',
      'Outliers clipped & StandardScaler fit strictly on X_train'
    ],
    testHarnessCode: `assert "result" in globals(), "Define result = build_clean_splits(DATASET_CSV)"
assert result["deduped_count"] == 19, f"Expected 19 deduped rows, got {result['deduped_count']}"
assert result["X_train"].shape[1] == 3 and result["X_test"].shape[1] == 3, "Keep strictly 3 clean features (drop loan_id & recovery_fee_charged)"
assert not np.isnan(result["X_train"]).any() and not np.isnan(result["X_test"]).any(), "NaNs still present"
assert abs(float(result["X_train"].mean())) < 1e-6, "X_train must be standardized using X_train statistics"
print("ALL LEAKAGE & CLEANING TESTS PASSED!")`
  },
  {
    id: 'customer-churn',
    name: 'SaaS Customer Churn (Negative Outliers, Duplicates & Exit-Survey Leakage)',
    hinglishName: 'SaaS Customer Churn (Corrupted Spend, Duplicates & Exit-Survey Leakage)',
    filename: 'customer_churn_messy.csv',
    targetColumn: 'churned',
    leakageColumns: ['cancellation_survey_score'],
    idColumns: ['customer_id'],
    description:
      'Predict subscription churn 30 days ahead. Contains corrupted negative spend (-999), missing tenure, duplicate account rows, and an exit survey filled ONLY after canceling.',
    hinglishDescription:
      '30 din pehle customer churn predict karein. Isme negative spend (-999), missing tenure, duplicate rows, aur cancellation_survey_score (jo cancel hone ke baad bhara jata hai) hai.',
    leakageExplanation:
      'cancellation_survey_score is collected AFTER a customer cancels! Including it gives fake 99% accuracy offline and 0% value in production.',
    hinglishLeakageExplanation:
      'cancellation_survey_score customer ke subscription cancel karne ke BAAD milta hai. Production mein predict karte waqt ye score exist hi nahi karega!',
    csvText: `customer_id,monthly_spend,tenure_months,support_tickets,cancellation_survey_score,churned
C201,49.0,14,1,0,0
C202,99.0,26,0,0,0
C203,29.0,,4,2,1
C204,-999.0,8,2,0,0
C205,149.0,32,1,0,0
C206,19.0,2,6,1,1
C206,19.0,2,6,1,1
C207,79.0,19,1,0,0
C208,39.0,,5,3,1
C209,199.0,45,0,0,0
C210,59.0,11,2,0,0
C211,29.0,3,7,2,1
C212,89.0,22,1,0,0
C213,49.0,16,0,0,0
C214,2500.0,10,1,0,0
C215,69.0,20,2,0,0
C216,19.0,1,8,1,1
C217,129.0,29,0,0,0`,
    buggyStarterCode: `import csv, io
import numpy as np

rows = list(csv.DictReader(io.StringIO(DATASET_CSV)))
# Bug: keeps -999 spend, duplicates C206, and keeps cancellation_survey_score!
print("Raw rows:", len(rows))
print("Distinct customer_ids:", len(set(r['customer_id'] for r in rows)))`,
    cleanStarterCode: `import csv, io
import numpy as np

def build_clean_splits(csv_text: str):
    rows = list(csv.DictReader(io.StringIO(csv_text)))

    seen = set()
    deduped = []
    for r in rows:
        cid = r['customer_id'].strip()
        if cid not in seen:
            seen.add(cid)
            deduped.append(r)

    pos = [r for r in deduped if int(r['churned']) == 1]
    neg = [r for r in deduped if int(r['churned']) == 0]
    train_rows = pos[:max(1, int(len(pos) * 0.8))] + neg[:max(1, int(len(neg) * 0.8))]
    test_rows = pos[max(1, int(len(pos) * 0.8)):] + neg[max(1, int(len(neg) * 0.8)):]

    # Compute valid positive train medians strictly on train_rows
    valid_train_spend = np.array([float(r['monthly_spend']) for r in train_rows if float(r['monthly_spend']) > 0])
    train_median_spend = float(np.median(valid_train_spend))
    q1, q3 = np.percentile(valid_train_spend, [25, 75])
    upper_spend_cap = q3 + 1.5 * (q3 - q1)

    train_tenures = np.array([float(r['tenure_months']) for r in train_rows if r['tenure_months'] != ''])
    train_median_tenure = float(np.median(train_tenures))

    def to_features(row_list):
        mat = []
        for r in row_list:
            spend = float(r['monthly_spend'])
            if spend <= 0:
                spend = train_median_spend
            spend = float(np.clip(spend, 0.0, upper_spend_cap))
            tenure = float(r['tenure_months']) if r['tenure_months'] != '' else train_median_tenure
            tickets = float(r['support_tickets'])
            mat.append([spend, tenure, tickets])
        return np.array(mat, dtype=float), np.array([int(r['churned']) for r in row_list], dtype=int)

    X_train_raw, y_train = to_features(train_rows)
    X_test_raw, y_test = to_features(test_rows)

    mu = X_train_raw.mean(axis=0)
    sigma = np.where(X_train_raw.std(axis=0) == 0, 1.0, X_train_raw.std(axis=0))
    return {
        "X_train": (X_train_raw - mu) / sigma,
        "X_test": (X_test_raw - mu) / sigma,
        "y_train": y_train,
        "y_test": y_test,
        "deduped_count": len(deduped),
        "dropped_cols": ["customer_id", "cancellation_survey_score"],
    }

result = build_clean_splits(DATASET_CSV)
print("Deduplicated customers:", result["deduped_count"])
print("Dropped cols:", result["dropped_cols"])
print("Train shape:", result["X_train"].shape, "| Test shape:", result["X_test"].shape)`,
    verificationTests: [
      'Deduplicated customer_id rows (17 unique customers)',
      'Dropped cancellation_survey_score leakage & customer_id',
      'Replaced negative corrupted spend & missing tenure with train medians',
      'Standardized X_train and X_test using strictly X_train statistics'
    ],
    testHarnessCode: `assert result["deduped_count"] == 17, f"Expected 17 deduped rows, got {result['deduped_count']}"
assert result["X_train"].shape[1] == 3, "Keep 3 clean features"
assert not np.isnan(result["X_train"]).any() and not np.isnan(result["X_test"]).any()
assert abs(float(result["X_train"].mean())) < 1e-6
print("ALL LEAKAGE & CLEANING TESTS PASSED!")`
  },
  {
    id: 'hospital-triage',
    name: 'Hospital Readmission Triage (Missing Labs, Outliers & Billing Leakage)',
    hinglishName: 'Hospital Readmission Triage (Missing Labs & Post-Discharge Leakage)',
    filename: 'readmission_triage_messy.csv',
    targetColumn: 'readmitted_30d',
    leakageColumns: ['readmit_billing_code'],
    idColumns: ['patient_visit_id'],
    description:
      'Predict 30-day hospital readmission at admission time. Features missing BMI/glucose readings, extreme ICU hours, and a post-readmission billing code.',
    hinglishDescription:
      'Admission ke waqt 30-day readmission risk predict karein. Missing BMI/glucose, extreme ICU hours aur discharge/readmission ke baad lagne wala billing code leakage detect karein.',
    leakageExplanation:
      'readmit_billing_code is assigned by hospital billing AFTER a readmission occurs — never available at triage time.',
    hinglishLeakageExplanation:
      'readmit_billing_code hospital billing team readmission hone ke BAAD assign karti hai — admission triage ke waqt ye available nahi hota!',
    csvText: `patient_visit_id,age,glucose,bmi,icu_hours,readmit_billing_code,readmitted_30d
P301,52,118,26.4,12,0,0
P302,68,,31.2,48,901,1
P303,41,96,23.8,6,0,0
P304,74,188,29.5,720,901,1
P305,36,102,,8,0,0
P306,61,145,28.1,24,0,0
P307,79,210,33.4,96,901,1
P308,45,109,25.0,10,0,0
P309,57,,27.3,14,0,0
P310,64,162,30.1,36,0,0
P311,71,195,32.0,110,901,1
P312,49,112,24.6,8,0,0
P313,55,128,26.9,16,0,0
P314,66,174,,54,901,1
P315,39,94,22.5,4,0,0`,
    buggyStarterCode: `import csv, io
rows = list(csv.DictReader(io.StringIO(DATASET_CSV)))
print("Rows:", len(rows))
print("WARNING: readmit_billing_code == 901 correlates 100% with readmitted_30d == 1!")`,
    cleanStarterCode: `import csv, io
import numpy as np

def build_clean_splits(csv_text: str):
    rows = list(csv.DictReader(io.StringIO(csv_text)))
    pos = [r for r in rows if int(r['readmitted_30d']) == 1]
    neg = [r for r in rows if int(r['readmitted_30d']) == 0]
    train_rows = pos[:max(1, int(len(pos) * 0.8))] + neg[:max(1, int(len(neg) * 0.8))]
    test_rows = pos[max(1, int(len(pos) * 0.8)):] + neg[max(1, int(len(neg) * 0.8)):]

    med_glucose = float(np.median([float(r['glucose']) for r in train_rows if r['glucose'] != '']))
    med_bmi = float(np.median([float(r['bmi']) for r in train_rows if r['bmi'] != '']))
    icu_vals = np.array([float(r['icu_hours']) for r in train_rows])
    q1, q3 = np.percentile(icu_vals, [25, 75])
    icu_cap = q3 + 1.5 * (q3 - q1)

    def to_matrix(rlist):
        mat = []
        for r in rlist:
            g = float(r['glucose']) if r['glucose'] != '' else med_glucose
            b = float(r['bmi']) if r['bmi'] != '' else med_bmi
            icu = float(np.clip(float(r['icu_hours']), 0.0, icu_cap))
            mat.append([float(r['age']), g, b, icu])
        return np.array(mat, dtype=float), np.array([int(r['readmitted_30d']) for r in rlist], dtype=int)

    X_tr, y_tr = to_matrix(train_rows)
    X_te, y_te = to_matrix(test_rows)
    mu = X_tr.mean(axis=0)
    sigma = np.where(X_tr.std(axis=0) == 0, 1.0, X_tr.std(axis=0))
    return {
        "X_train": (X_tr - mu) / sigma,
        "X_test": (X_te - mu) / sigma,
        "y_train": y_tr,
        "y_test": y_te,
        "deduped_count": len(rows),
        "dropped_cols": ["patient_visit_id", "readmit_billing_code"],
    }

result = build_clean_splits(DATASET_CSV)
print("Clean train shape:", result["X_train"].shape, "| Test shape:", result["X_test"].shape)`,
    verificationTests: [
      'Dropped readmit_billing_code & patient_visit_id (4 clean features)',
      'Imputed missing glucose/bmi using train medians only',
      'Clipped extreme ICU hours outlier (720h) via train IQR bounds',
      'Standardized using strictly X_train statistics'
    ],
    testHarnessCode: `assert result["X_train"].shape[1] == 4
assert not np.isnan(result["X_train"]).any() and not np.isnan(result["X_test"]).any()
assert abs(float(result["X_train"].mean())) < 1e-6
print("ALL LEAKAGE & CLEANING TESTS PASSED!")`
  }
];
