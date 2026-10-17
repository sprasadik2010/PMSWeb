export interface DrugSafetyAlert {
  id: string
  type: 'danger' | 'warning' | 'info'
  title: string
  description: string
  involvedDrugs: string[]
}

interface MedicineItem {
  medicine_name: string
  dosage?: string
  frequency?: string
  duration?: string
  instruction?: string
}

const NSAID_KEYWORDS = [
  'paracetamol', 'acetaminophen', 'dolo', 'calpol', 'crocin',
  'ibuprofen', 'combiflam', 'brufen',
  'diclofenac', 'voveran',
  'aceclofenac', 'zerodol',
  'naproxen', 'naprosyn',
  'ketorolac', 'ketonov',
  'mefenamic', 'meftal',
  'tramadol', 'ultram',
  'aspirin', 'ecosprin',
  'piroxicam', 'feldene'
]

const PPI_KEYWORDS = [
  'pantoprazole', 'pan', 'pantocid',
  'omeprazole', 'omez',
  'rabeprazole', 'rabeloc', 'razo',
  'esomeprazole', 'nexpro',
  'lansoprazole', 'junior lanzol',
  'ranitidine', 'aciloc', 'zantac',
  'famotidine', 'famocid'
]

const ANTIBIOTIC_KEYWORDS = [
  'amoxicillin', 'augmentin', 'mox', 'amoxyclav',
  'azithromycin', 'azithral', 'zithromax',
  'ciprofloxacin', 'cifran', 'ciiproglen',
  'cefixime', 'zifi', 'taxim-o',
  'cefpodoxime', 'monocep',
  'ceftriaxone', 'monocef',
  'doxycycline', 'doxil',
  'levofloxacin', 'levomac',
  'metronidazole', 'flagyl',
  'clarithromycin', 'claribid',
  'ofloxacin', 'zanocin', 'oflox'
]

function matchesAny(medName: string, keywords: string[]): boolean {
  const lower = medName.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

export function checkDrugSafety(items: MedicineItem[]): DrugSafetyAlert[] {
  const alerts: DrugSafetyAlert[] = []
  const validItems = items.filter(i => i.medicine_name.trim().length > 0)
  if (validItems.length === 0) return alerts

  // 1. Duplicate NSAIDs / Analgesics
  const nsaidMatches = validItems.filter(i => matchesAny(i.medicine_name, NSAID_KEYWORDS))
  if (nsaidMatches.length > 1) {
    alerts.push({
      id: 'duplicate-nsaid',
      type: 'danger',
      title: 'Duplicate Analgesic / NSAID Therapy Detected',
      description: `Combining multiple NSAIDs/antipyretics (${nsaidMatches.map(m => m.medicine_name).join(', ')}) significantly elevates the risk of acute gastric bleeding, peptic ulcers, and hepatorenal toxicity.`,
      involvedDrugs: nsaidMatches.map(m => m.medicine_name)
    })
  }

  // 2. Duplicate PPIs / Acid Reducers
  const ppiMatches = validItems.filter(i => matchesAny(i.medicine_name, PPI_KEYWORDS))
  if (ppiMatches.length > 1) {
    alerts.push({
      id: 'duplicate-ppi',
      type: 'warning',
      title: 'Redundant Gastric Acid Suppressants',
      description: `Multiple proton pump inhibitors or H2 blockers (${ppiMatches.map(m => m.medicine_name).join(', ')}) prescribed concurrently. A single acid suppressor is recommended for standard outpatient care.`,
      involvedDrugs: ppiMatches.map(m => m.medicine_name)
    })
  }

  // 3. Multiple Systemic Antibiotics
  const abxMatches = validItems.filter(i => matchesAny(i.medicine_name, ANTIBIOTIC_KEYWORDS))
  if (abxMatches.length > 1) {
    alerts.push({
      id: 'multiple-abx',
      type: 'warning',
      title: 'Concurrent Antibiotic Regimen',
      description: `Multiple systemic antibiotics prescribed (${abxMatches.map(m => m.medicine_name).join(', ')}). Verify dual-coverage indications to avoid severe gut dysbiosis and antimicrobial resistance.`,
      involvedDrugs: abxMatches.map(m => m.medicine_name)
    })
  }

  // 4. NSAID without Gastroprotection
  const hasStrongNsaid = validItems.some(i => {
    const l = i.medicine_name.toLowerCase()
    return l.includes('diclofenac') || l.includes('aceclofenac') || l.includes('ibuprofen') || l.includes('ketorolac')
  })
  const hasPpi = ppiMatches.length > 0
  if (hasStrongNsaid && !hasPpi) {
    alerts.push({
      id: 'nsaid-no-ppi',
      type: 'info',
      title: 'Gastroprotection Recommendation',
      description: 'A potent NSAID is charted without an accompanying gastric mucosal protector (PPI/H2-blocker like Pantoprazole). Consider co-prescribing if patient is dyspepsia-prone.',
      involvedDrugs: []
    })
  }

  // 5. Extended antibiotic duration (>14 days)
  abxMatches.forEach(abx => {
    if (abx.duration) {
      const match = abx.duration.match(/(\d+)/)
      if (match) {
        const days = parseInt(match[1])
        if (days > 14 && (abx.duration.toLowerCase().includes('day') || !abx.duration.toLowerCase().includes('month'))) {
          alerts.push({
            id: `prolonged-abx-${abx.medicine_name}`,
            type: 'warning',
            title: `Extended Antibiotic Course: ${abx.medicine_name}`,
            description: `Antibiotic charted for ${abx.duration}. Courses exceeding 14 days require monitoring for secondary fungal overgrowth and organ clearance.`,
            involvedDrugs: [abx.medicine_name]
          })
        }
      }
    }
  })

  return alerts
}
