// Voice-to-Prescription Clinical Speech Parser using Web Speech API & NLP Extraction

export interface ParsedClinicalData {
  bp_systolic?: number
  bp_diastolic?: number
  pulse?: number
  temperature?: number
  weight_kg?: number
  spo2?: number
  blood_sugar?: number
  chief_complaint?: string
  diagnosis?: string
  advice?: string
  investigations_advised?: string
  follow_up_days?: number
  medicines: Array<{
    medicine_name: string
    dosage: string
    frequency: string
    duration: string
    instruction: string
    route: string
  }>
}

export function parseClinicalSpeech(transcript: string): ParsedClinicalData {
  const result: ParsedClinicalData = {
    medicines: []
  }

  const text = transcript.toLowerCase()

  // 1. Extract Blood Pressure (e.g., "blood pressure 120 over 80", "bp 130/85", "bp 120 80")
  const bpMatch = text.match(/(?:blood pressure|bp)\s*(?:is|of)?\s*(\d{2,3})\s*(?:over|\/|\s)\s*(\d{2,3})/i)
  if (bpMatch) {
    result.bp_systolic = parseInt(bpMatch[1], 10)
    result.bp_diastolic = parseInt(bpMatch[2], 10)
  }

  // 2. Extract Pulse (e.g., "pulse 72", "pulse rate 80", "heart rate 76")
  const pulseMatch = text.match(/(?:pulse|heart rate|pulse rate)\s*(?:is|of)?\s*(\d{2,3})/i)
  if (pulseMatch) {
    result.pulse = parseInt(pulseMatch[1], 10)
  }

  // 3. Extract Temperature (e.g., "temperature 100.4", "temp 99", "temp 101.2")
  const tempMatch = text.match(/(?:temperature|temp|fever)\s*(?:is|of)?\s*(\d{2,3}(?:\.\d)?)/i)
  if (tempMatch) {
    const val = parseFloat(tempMatch[1])
    if (val >= 95 && val <= 108) {
      result.temperature = val
    }
  }

  // 4. Extract Weight (e.g., "weight 70 kg", "weight 68.5")
  const weightMatch = text.match(/(?:weight)\s*(?:is|of)?\s*(\d{2,3}(?:\.\d)?)/i)
  if (weightMatch) {
    result.weight_kg = parseFloat(weightMatch[1])
  }

  // 5. Extract SpO2 (e.g., "spo2 98", "oxygen 99 percent")
  const spo2Match = text.match(/(?:spo2|oxygen|saturation)\s*(?:is|of)?\s*(\d{2,3})/i)
  if (spo2Match) {
    const val = parseInt(spo2Match[1], 10)
    if (val >= 70 && val <= 100) {
      result.spo2 = val
    }
  }

  // 6. Extract Blood Sugar (e.g., "blood sugar 130", "sugar 110", "rbs 145")
  const sugarMatch = text.match(/(?:blood sugar|sugar|rbs|fbs)\s*(?:is|of)?\s*(\d{2,3})/i)
  if (sugarMatch) {
    result.blood_sugar = parseFloat(sugarMatch[1])
  }

  // 7. Extract Complaints / Symptoms (e.g., "complaint of ...", "symptoms are ...")
  const complaintMatch = text.match(/(?:complaints?|symptoms?|suffering from)\s*(?:of|are|is)?\s*([^.]+?)(?=\.|\s*(?:blood pressure|bp|pulse|temp|diagnosis|prescribe|advice))/i)
  if (complaintMatch) {
    result.chief_complaint = complaintMatch[1].trim()
  }

  // 8. Extract Diagnosis (e.g., "diagnosis is ...", "diagnosed with ...", "impression is ...")
  const diagMatch = text.match(/(?:diagnosis|diagnosed with|impression|provisional diagnosis)\s*(?:is)?\s*([^.]+?)(?=\.|\s*(?:prescribe|give|treatment|advice|investigations))/i)
  if (diagMatch) {
    result.diagnosis = diagMatch[1].trim()
  }

  // 9. Extract Advice (e.g., "advice ...", "advise ...")
  const adviceMatch = text.match(/(?:advice|advise|instructions?)\s*(?:is|to)?\s*([^.]+?)(?=\.|\s*(?:investigations|follow up|tests))/i)
  if (adviceMatch) {
    result.advice = adviceMatch[1].trim()
  }

  // 10. Extract Investigations (e.g., "investigations advised ...", "tests advised ...")
  const testMatch = text.match(/(?:investigations?|lab tests?|tests?)\s*(?:advised|needed|recommended)?\s*([^.]+?)(?=\.|\s*(?:follow up|review))/i)
  if (testMatch) {
    result.investigations_advised = testMatch[1].trim()
  }

  // 11. Extract Follow-up days (e.g., "follow up in 5 days", "review after 3 days", "review in 1 week")
  const followUpMatch = text.match(/(?:follow up|review|visit again)\s*(?:in|after)?\s*(\d+)\s*(days?|weeks?)/i)
  if (followUpMatch) {
    const num = parseInt(followUpMatch[1], 10)
    const unit = followUpMatch[2].toLowerCase()
    result.follow_up_days = unit.startsWith('week') ? num * 7 : num
  }

  // 12. Extract Medications (e.g. "prescribe Paracetamol 650 twice daily for 3 days after food")
  // Common frequency mappings
  const detectFrequency = (str: string): string => {
    if (/twice (?:a )?day|twice daily|morning and night|1 0 1|one zero one/i.test(str)) return '1-0-1'
    if (/three times|thrice daily|1 1 1|one one one/i.test(str)) return '1-1-1'
    if (/once (?:a )?day|once daily|morning only|1 0 0|one zero zero/i.test(str)) return '1-0-0'
    if (/night only|bedtime|before sleeping|0 0 1|zero zero one/i.test(str)) return '0-0-1'
    if (/as needed|sos|when required/i.test(str)) return 'SOS'
    if (/immediately|stat/i.test(str)) return '1 stat'
    return '1-0-1'
  }

  const detectInstruction = (str: string): string => {
    if (/before food|empty stomach|before breakfast/i.test(str)) return 'Before Food'
    if (/with milk/i.test(str)) return 'With Milk'
    if (/after food|after meals/i.test(str)) return 'After Food'
    return 'After Food'
  }

  const detectDuration = (str: string): string => {
    const dMatch = str.match(/(\d+)\s*(days?|weeks?|months?)/i)
    if (dMatch) {
      return `${dMatch[1]} ${dMatch[2]}`
    }
    return '5 days'
  }

  // Split prescription section if present
  const medSection = text.match(/(?:prescribe|give medications?|medicines?|rx)\s*[:]?\s*(.+)/i)
  if (medSection) {
    const medText = medSection[1]
    // Split by "and", comma, or "also"
    const items = medText.split(/(?:,|\sand\s|\salso\s|\splus\s)/i)
    
    for (const item of items) {
      const clean = item.trim()
      if (clean.length > 3) {
        // Find possible drug name (e.g. Paracetamol 650, Amoxiclav, Azithromycin, Pantoprazole)
        const drugMatch = clean.match(/(?:tablet|tab|syrup|capsule|inj|injection)?\s*([a-zA-Z0-9\s-]+?\b(?:\d+mg|\d+)?)/i)
        const rawName = drugMatch ? drugMatch[1].trim() : clean
        
        // Exclude common non-medicine phrases
        if (!/^(advice|follow|review|blood|pressure|pulse|patient)/i.test(rawName)) {
          // Capitalize first letters
          const formattedName = rawName.replace(/\b\w/g, c => c.toUpperCase())
          
          result.medicines.push({
            medicine_name: formattedName,
            dosage: /syrup/i.test(clean) ? '10 ml' : '1 tablet',
            frequency: detectFrequency(clean),
            duration: detectDuration(clean),
            instruction: detectInstruction(clean),
            route: /syrup/i.test(clean) ? 'Oral' : /inj/i.test(clean) ? 'IV/IM' : 'Oral'
          })
        }
      }
    }
  }

  return result
}
