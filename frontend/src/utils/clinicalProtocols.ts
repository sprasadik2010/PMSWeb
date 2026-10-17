// 1-Click Clinical Disease Protocols & Treatment Bundles

export interface ClinicalProtocol {
  id: string
  name: string
  category: string
  diagnosis: string
  chief_complaint: string
  advice: string
  investigations_advised?: string
  follow_up_days: number
  medicines: Array<{
    medicine_name: string
    dosage: string
    frequency: string
    duration: string
    instruction: string
    route: string
  }>
}

export const CLINICAL_PROTOCOLS: ClinicalProtocol[] = [
  {
    id: 'viral-fever',
    name: 'Viral Fever & Acute URTI',
    category: 'General Medicine',
    diagnosis: 'Acute Upper Respiratory Tract Infection (URTI) with Viral Pyrexia',
    chief_complaint: 'Fever with chills since 2 days, runny nose, throat irritation, generalized body aches',
    advice: 'Drink warm fluids, steam inhalation twice daily, adequate bed rest, avoid cold/chilled beverages',
    investigations_advised: 'CBC (Complete Blood Count) if fever persists > 3 days',
    follow_up_days: 3,
    medicines: [
      {
        medicine_name: 'Paracetamol 650mg',
        dosage: '1 tablet',
        frequency: '1-0-1',
        duration: '3 days',
        instruction: 'After Food',
        route: 'Oral'
      },
      {
        medicine_name: 'Montair-LC (Montelukast + Levocetirizine)',
        dosage: '1 tablet',
        frequency: '0-0-1',
        duration: '5 days',
        instruction: 'Bedtime',
        route: 'Oral'
      },
      {
        medicine_name: 'Ascoril-D Plus Cough Syrup',
        dosage: '10 ml',
        frequency: '1-1-1',
        duration: '5 days',
        instruction: 'After Food',
        route: 'Oral'
      },
      {
        medicine_name: 'Vitamin C 500mg Chewable',
        dosage: '1 tablet',
        frequency: '1-0-0',
        duration: '7 days',
        instruction: 'After Breakfast',
        route: 'Oral'
      }
    ]
  },
  {
    id: 'acute-gastritis',
    name: 'Acute Gastritis / Acid Peptic Disease (GERD)',
    category: 'Gastroenterology',
    diagnosis: 'Acute Acid Peptic Disease / Reflux Esophagitis (GERD)',
    chief_complaint: 'Epigastric burning pain, sour belching, heartburn after meals, nausea',
    advice: 'Avoid spicy, oily, and fried foods. Eat frequent small meals. Avoid lying down immediately after meals. Restrict caffeine/tea.',
    investigations_advised: 'USG Abdomen if pain radiates to back or right hypochondrium',
    follow_up_days: 7,
    medicines: [
      {
        medicine_name: 'Pantocid 40mg (Pantoprazole)',
        dosage: '1 tablet',
        frequency: '1-0-0',
        duration: '14 days',
        instruction: 'Empty Stomach (30 mins before breakfast)',
        route: 'Oral'
      },
      {
        medicine_name: 'Digene / Mucaine Gel',
        dosage: '10 ml',
        frequency: '1-1-1',
        duration: '5 days',
        instruction: 'After Food or during acute pain',
        route: 'Oral'
      },
      {
        medicine_name: 'Domperidone 10mg',
        dosage: '1 tablet',
        frequency: '1-0-1',
        duration: '5 days',
        instruction: 'Before Food',
        route: 'Oral'
      }
    ]
  },
  {
    id: 'bacterial-tonsillitis',
    name: 'Bacterial Pharyngitis / Tonsillitis',
    category: 'ENT / Medicine',
    diagnosis: 'Acute Exudative Tonsillitis / Pharyngitis',
    chief_complaint: 'Severe sore throat, painful swallowing (odynophagia), low-grade fever, cervical lymphadenopathy',
    advice: 'Warm saline gargles 3-4 times daily, soft warm diet, avoid cold items',
    investigations_advised: 'Throat swab culture if non-responsive to first-line antibiotic',
    follow_up_days: 5,
    medicines: [
      {
        medicine_name: 'Amoxiclav 625mg (Amoxicillin + Clavulanic Acid)',
        dosage: '1 tablet',
        frequency: '1-0-1',
        duration: '5 days',
        instruction: 'After Food',
        route: 'Oral'
      },
      {
        medicine_name: 'Paracetamol 650mg',
        dosage: '1 tablet',
        frequency: '1-0-1',
        duration: '3 days',
        instruction: 'After Food',
        route: 'Oral'
      },
      {
        medicine_name: 'Betadine 2% Gargle Solution',
        dosage: '10 ml with warm water',
        frequency: '1-0-1',
        duration: '5 days',
        instruction: 'Gargle & Spit',
        route: 'Topical'
      },
      {
        medicine_name: 'Becosules (B-Complex + Zinc)',
        dosage: '1 capsule',
        frequency: '1-0-0',
        duration: '7 days',
        instruction: 'After Food',
        route: 'Oral'
      }
    ]
  },
  {
    id: 'acute-gastroenteritis',
    name: 'Acute Gastroenteritis / Diarrhea',
    category: 'Gastroenterology',
    diagnosis: 'Acute Infectious Gastroenteritis with Mild Dehydration',
    chief_complaint: 'Loose watery stools 5-6 episodes, abdominal cramping, mild nausea, fatigue',
    advice: 'Consume Oral Rehydration Salts (ORS) solution after every loose motion. Drink tender coconut water, rice kanji, curd. Strict avoidance of outside food/cut fruits.',
    investigations_advised: 'Stool Routine & Microscopy, Serum Electrolytes if vomiting worsens',
    follow_up_days: 3,
    medicines: [
      {
        medicine_name: 'ORS Electral Powder',
        dosage: '1 sachet in 1 liter water',
        frequency: 'SOS',
        duration: '3 days',
        instruction: 'Sip throughout the day',
        route: 'Oral'
      },
      {
        medicine_name: 'Ofloxacin + Ornidazole (O2)',
        dosage: '1 tablet',
        frequency: '1-0-1',
        duration: '3 days',
        instruction: 'After Food',
        route: 'Oral'
      },
      {
        medicine_name: 'Dicyclomine 20mg (Spasmoproxyvon / Cyclopam)',
        dosage: '1 tablet',
        frequency: 'SOS',
        duration: '2 days',
        instruction: 'During acute stomach cramps',
        route: 'Oral'
      },
      {
        medicine_name: 'Econorm / Darolac (Probiotic Sachet)',
        dosage: '1 sachet',
        frequency: '1-0-1',
        duration: '5 days',
        instruction: 'With water or curd',
        route: 'Oral'
      }
    ]
  },
  {
    id: 'hypertension-review',
    name: 'Essential Hypertension Review',
    category: 'Cardiology',
    diagnosis: 'Essential Systemic Hypertension (Stage 1 / Review)',
    chief_complaint: 'Occasional morning occipital headache, mild dizziness, routine BP evaluation',
    advice: 'Strict low salt diet (<5g/day). 30 minutes brisk walking daily. Avoid tobacco and alcohol. Regular home BP monitoring log.',
    investigations_advised: 'Lipid Profile, Serum Creatinine, ECG, Urine Microalbumin',
    follow_up_days: 14,
    medicines: [
      {
        medicine_name: 'Telmisartan 40mg',
        dosage: '1 tablet',
        frequency: '1-0-0',
        duration: '30 days',
        instruction: 'Morning after breakfast',
        route: 'Oral'
      },
      {
        medicine_name: 'Amlodipine 5mg',
        dosage: '1 tablet',
        frequency: '0-0-1',
        duration: '30 days',
        instruction: 'Bedtime',
        route: 'Oral'
      }
    ]
  },
  {
    id: 'diabetes-review',
    name: 'Type 2 Diabetes Mellitus Management',
    category: 'Endocrinology',
    diagnosis: 'Type 2 Diabetes Mellitus with Suboptimal Glycemic Control',
    chief_complaint: 'Increased thirst (polydipsia), frequent urination at night, fatigue, routine diabetic review',
    advice: 'Strict diabetic diet (no refined sugar/sweets/potatoes). High fiber diet. Daily foot care inspection. 45 minutes regular exercise.',
    investigations_advised: 'HbA1c, Fasting & Post-Prandial Blood Sugar, Kidney Function Test (KFT)',
    follow_up_days: 30,
    medicines: [
      {
        medicine_name: 'Metformin 500mg SR',
        dosage: '1 tablet',
        frequency: '1-0-1',
        duration: '30 days',
        instruction: 'With or immediately after meals',
        route: 'Oral'
      },
      {
        medicine_name: 'Glimepiride 1mg',
        dosage: '1 tablet',
        frequency: '1-0-0',
        duration: '30 days',
        instruction: '15 mins before breakfast',
        route: 'Oral'
      },
      {
        medicine_name: 'Methylcobalamin (B12) + Alpha Lipoic Acid',
        dosage: '1 capsule',
        frequency: '0-0-1',
        duration: '30 days',
        instruction: 'After Dinner',
        route: 'Oral'
      }
    ]
  }
]
