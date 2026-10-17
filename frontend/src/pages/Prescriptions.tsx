import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Search,
  HeartPulse,
  X,
  Stethoscope,
  CheckCircle2,
  Mic,
  MicOff,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Info,
  MessageSquare,
  QrCode,
  PenTool,
  Zap,
  Check,
  Volume2
} from 'lucide-react'

import { SignaturePad } from '../components/SignaturePad'
import { CLINICAL_PROTOCOLS, type ClinicalProtocol } from '../utils/clinicalProtocols'
import { parseClinicalSpeech } from '../utils/voiceParser'
import { checkDrugSafety, type DrugSafetyAlert } from '../utils/drugSafetyChecker'

interface MedicineOption {
  id: number
  brand_name: string
  generic_name?: string
  category: string
  strength?: string
  default_dosage: string
  default_frequency: string
  default_duration: string
  default_instruction: string
}

interface PrescriptionItem {
  medicine_name: string
  dosage: string
  frequency: string
  duration: string
  instruction: string
  route: string
}

interface Patient {
  id: number
  name: string
  op_number: string
  age: string
  gender: string
  phone: string
}

interface Doctor {
  id: number
  name: string
  specialty: string
  qualification: string
}

interface PrescriptionRecord {
  id: number
  prescription_number: string
  patient_id: number
  doctor_id: number
  date: string
  bp_systolic?: number
  bp_diastolic?: number
  pulse?: number
  temperature?: number
  weight_kg?: number
  spo2?: number
  blood_sugar?: number
  chief_complaint?: string
  diagnosis?: string
  clinical_notes?: string
  advice?: string
  investigations_advised?: string
  follow_up_date?: string
  patient_name?: string
  patient_age?: string
  patient_gender?: string
  doctor_name?: string
  doctor_specialty?: string
  items: PrescriptionItem[]
}

export const Prescriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new')
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [medicines, setMedicines] = useState<MedicineOption[]>([])
  const [pastPrescriptions, setPastPrescriptions] = useState<PrescriptionRecord[]>([])
  const [clinicSetting, setClinicSetting] = useState<any>(null)

  // Selection states
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('')
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('')
  const [patientSearch, setPatientSearch] = useState('')
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])

  // Vitals
  const [bpSystolic, setBpSystolic] = useState<string>('')
  const [bpDiastolic, setBpDiastolic] = useState<string>('')
  const [pulse, setPulse] = useState<string>('')
  const [temperature, setTemperature] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [spo2, setSpo2] = useState<string>('')
  const [bloodSugar, setBloodSugar] = useState<string>('')

  // Clinical Notes
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [advice, setAdvice] = useState('')
  const [investigationsAdvised, setInvestigationsAdvised] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  // Rx Items
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicine_name: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', instruction: 'After Food', route: 'Oral' }
  ])

  // Print modal & QR Code
  const [printRx, setPrintRx] = useState<PrescriptionRecord | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Innovative Features State
  // 1. Voice-to-Prescription (AI Medical Scribe)
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const recognitionRef = useRef<any>(null)

  // 2. Doctor Signature Pad
  const [doctorSignature, setDoctorSignature] = useState<string | null>(() => {
    return localStorage.getItem('pms_doctor_signature') || null
  })
  const [showSignatureModal, setShowSignatureModal] = useState(false)

  // 3. Clinical Protocol Selector
  const [selectedProtocolId, setSelectedProtocolId] = useState('')

  // 4. Real-time Drug Safety Alerts
  const [drugAlerts, setDrugAlerts] = useState<DrugSafetyAlert[]>([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Live drug safety evaluation whenever items change
  useEffect(() => {
    const alerts = checkDrugSafety(items)
    setDrugAlerts(alerts)
  }, [items])

  // Generate QR Code whenever printRx modal opens
  useEffect(() => {
    if (printRx) {
      generatePrescriptionQr(printRx)
    } else {
      setQrCodeDataUrl('')
    }
  }, [printRx])

  const fetchInitialData = async () => {
    try {
      const [ptsRes, docsRes, medsRes, setRes] = await Promise.all([
        axios.get('/patients/'),
        axios.get('/doctors/'),
        axios.get('/medicines/'),
        axios.get('/clinic-settings/')
      ])
      setPatients(ptsRes.data)
      setFilteredPatients(ptsRes.data)
      setDoctors(docsRes.data)
      setMedicines(medsRes.data)
      setClinicSetting(setRes.data)

      if (docsRes.data.length > 0) {
        setSelectedDoctorId(docsRes.data[0].id)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    }
  }

  const fetchPrescriptionsList = async () => {
    try {
      const res = await axios.get('/prescriptions/')
      setPastPrescriptions(res.data)
    } catch (err) {
      console.error('Failed to load prescriptions:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'list') {
      fetchPrescriptionsList()
    }
  }, [activeTab])

  // Generate QR code content for prescription
  const generatePrescriptionQr = async (rx: PrescriptionRecord) => {
    try {
      const p = patients.find(pt => pt.id === rx.patient_id)
      const patientName = rx.patient_name || p?.name || 'Patient'
      const lines = [
        `📋 RX MEDICINE SCHEDULE`,
        `Hospital: ${clinicSetting?.clinic_name || 'City Care Hospital'}`,
        `Patient: ${patientName} (${rx.patient_age || p?.age || ''}y)`,
        `Rx: ${rx.prescription_number} | Date: ${new Date(rx.date).toLocaleDateString()}`,
        `Doctor: ${rx.doctor_name || 'Consultant'}`,
        `-----------------------------`,
        `MEDICATION DOSAGE SCHEDULE:`,
        ...(rx.items || []).map((m, idx) => 
          `${idx + 1}. ${m.medicine_name}\n   Dose: ${m.dosage} | ${m.frequency}\n   Duration: ${m.duration} (${m.instruction})`
        ),
        `-----------------------------`,
        rx.advice ? `Advice: ${rx.advice}` : '',
        rx.follow_up_date ? `Next Review: ${new Date(rx.follow_up_date).toLocaleDateString()}` : '',
        `Helpline: ${clinicSetting?.phone || '+91 98765 43210'}`
      ].filter(Boolean).join('\n')

      const url = await QRCode.toDataURL(lines, {
        width: 150,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      setQrCodeDataUrl(url)
    } catch (e) {
      console.error('Error generating prescription QR:', e)
    }
  }

  // --- Voice-to-Prescription Web Speech Integration ---
  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice dictation is supported in Google Chrome, Microsoft Edge, and Safari')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' '
        }
        setVoiceTranscript(transcript.trim())
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone permission.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
      setShowVoiceModal(true)
    } catch (e) {
      console.error('Failed to initialize speech recognition:', e)
      toast.error('Could not activate microphone')
    }
  }

  const stopVoiceDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const applyVoiceTranscript = () => {
    if (!voiceTranscript.trim()) {
      toast.error('No spoken transcript recorded')
      return
    }

    const parsed = parseClinicalSpeech(voiceTranscript)
    let appliedCount = 0

    if (parsed.bp_systolic) { setBpSystolic(String(parsed.bp_systolic)); appliedCount++ }
    if (parsed.bp_diastolic) { setBpDiastolic(String(parsed.bp_diastolic)); appliedCount++ }
    if (parsed.pulse) { setPulse(String(parsed.pulse)); appliedCount++ }
    if (parsed.temperature) { setTemperature(String(parsed.temperature)); appliedCount++ }
    if (parsed.weight_kg) { setWeightKg(String(parsed.weight_kg)); appliedCount++ }
    if (parsed.spo2) { setSpo2(String(parsed.spo2)); appliedCount++ }
    if (parsed.blood_sugar) { setBloodSugar(String(parsed.blood_sugar)); appliedCount++ }
    if (parsed.chief_complaint) { setChiefComplaint(parsed.chief_complaint); appliedCount++ }
    if (parsed.diagnosis) { setDiagnosis(parsed.diagnosis); appliedCount++ }
    if (parsed.advice) { setAdvice(parsed.advice); appliedCount++ }
    if (parsed.investigations_advised) { setInvestigationsAdvised(parsed.investigations_advised); appliedCount++ }

    if (parsed.follow_up_days) {
      const d = new Date()
      d.setDate(d.getDate() + parsed.follow_up_days)
      setFollowUpDate(d.toISOString().split('T')[0])
      appliedCount++
    }

    if (parsed.medicines && parsed.medicines.length > 0) {
      setItems(parsed.medicines)
      appliedCount += parsed.medicines.length
    }

    toast.success(`Voice AI parsed & filled ${appliedCount} clinical fields!`)
    stopVoiceDictation()
    setShowVoiceModal(false)
  }

  // --- 1-Click Clinical Disease Protocol Auto-Fill ---
  const handleSelectProtocol = (protocolId: string) => {
    setSelectedProtocolId(protocolId)
    if (!protocolId) return

    const protocol = CLINICAL_PROTOCOLS.find(p => p.id === protocolId)
    if (!protocol) return

    setChiefComplaint(protocol.chief_complaint)
    setDiagnosis(protocol.diagnosis)
    setAdvice(protocol.advice)
    if (protocol.investigations_advised) {
      setInvestigationsAdvised(protocol.investigations_advised)
    }

    // Set follow-up date
    const d = new Date()
    d.setDate(d.getDate() + protocol.follow_up_days)
    setFollowUpDate(d.toISOString().split('T')[0])

    // Load full medication regimen
    setItems(protocol.medicines)
    toast.success(`Loaded "${protocol.name}" clinical protocol!`)
  }

  // --- Doctor Digital Signature Handler ---
  const handleSaveSignature = (dataUrl: string | null) => {
    setDoctorSignature(dataUrl)
    if (dataUrl) {
      localStorage.setItem('pms_doctor_signature', dataUrl)
      toast.success('Digital signature saved!')
    } else {
      localStorage.removeItem('pms_doctor_signature')
      toast.success('Signature cleared')
    }
    setShowSignatureModal(false)
  }

  // --- Direct WhatsApp Prescription Share ---
  const handleShareWhatsApp = (rx: PrescriptionRecord) => {
    const patient = patients.find(p => p.id === rx.patient_id)
    const rawPhone = patient?.phone || ''
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '')

    const clinicName = clinicSetting?.clinic_name || 'City Care Hospital & Research Center'
    const doctorName = rx.doctor_name || doctors.find(d => d.id === rx.doctor_id)?.name || 'Consulting Physician'

    const messageLines = [
      `🏥 *${clinicName}*`,
      `📋 *E-PRESCRIPTION & DOSAGE SCHEDULE*`,
      `----------------------------------------`,
      `*Patient Name:* ${rx.patient_name || patient?.name} (${rx.patient_age || patient?.age}y / ${rx.patient_gender || patient?.gender})`,
      `*OP Number:* ${patient?.op_number || 'OP-Patient'}`,
      `*Consulting Doctor:* ${doctorName} (${rx.doctor_specialty || 'General Practitioner'})`,
      `*Date:* ${new Date(rx.date).toLocaleDateString()}`,
      rx.diagnosis ? `*Diagnosis:* ${rx.diagnosis}` : '',
      `----------------------------------------`,
      `*PRESCRIBED MEDICINES:*`,
      ...(rx.items || []).map((m, idx) => 
        `${idx + 1}. *${m.medicine_name}*\n   • Dosage: ${m.dosage}\n   • Frequency: ${m.frequency}\n   • Instructions: ${m.instruction}\n   • Course Duration: ${m.duration}`
      ),
      `----------------------------------------`,
      rx.advice ? `*Doctor's Advice & Diet:* ${rx.advice}` : '',
      rx.investigations_advised ? `*Lab Tests Advised:* ${rx.investigations_advised}` : '',
      rx.follow_up_date ? `*Next Follow-up Visit:* ${new Date(rx.follow_up_date).toLocaleDateString()}` : '',
      `----------------------------------------`,
      `*Emergency / Clinic Helpline:* ${clinicSetting?.phone || '+91 98765 43210'}`,
      `_Please take all medications strictly on schedule. Wishing you a swift recovery!_`
    ].filter(Boolean).join('\n\n')

    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageLines)}`
    window.open(url, '_blank')
  }

  // Patient Search & Selection
  const handlePatientSearch = (query: string) => {
    setPatientSearch(query)
    if (!query.trim()) {
      setFilteredPatients(patients)
    } else {
      const q = query.toLowerCase()
      setFilteredPatients(
        patients.filter(
          p => p.name.toLowerCase().includes(q) ||
               p.op_number.toLowerCase().includes(q) ||
               p.phone.includes(q)
        )
      )
    }
  }

  const selectPatient = (p: Patient) => {
    setSelectedPatientId(p.id)
    setPatientSearch(`${p.name} (${p.op_number})`)
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      { medicine_name: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', instruction: 'After Food', route: 'Oral' }
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error('At least one medication is required')
      return
    }
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const handleSelectMedicine = (index: number, med: MedicineOption) => {
    const updated = [...items]
    updated[index] = {
      medicine_name: `${med.brand_name} ${med.strength ? `(${med.strength})` : ''}`,
      dosage: med.default_dosage || '1 tablet',
      frequency: med.default_frequency || '1-0-1',
      duration: med.default_duration || '5 days',
      instruction: med.default_instruction || 'After Food',
      route: med.category === 'Syrup' ? 'Oral' : med.category === 'Injection' ? 'IV/IM' : 'Oral'
    }
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPatientId) {
      toast.error('Please select a patient')
      return
    }
    if (!selectedDoctorId) {
      toast.error('Please select a consulting doctor')
      return
    }

    const validItems = items.filter(i => i.medicine_name.trim().length > 0)
    if (validItems.length === 0) {
      toast.error('Please enter at least one prescribed medicine')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        patient_id: Number(selectedPatientId),
        doctor_id: Number(selectedDoctorId),
        bp_systolic: bpSystolic ? parseInt(bpSystolic) : undefined,
        bp_diastolic: bpDiastolic ? parseInt(bpDiastolic) : undefined,
        pulse: pulse ? parseInt(pulse) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        spo2: spo2 ? parseInt(spo2) : undefined,
        blood_sugar: bloodSugar ? parseFloat(bloodSugar) : undefined,
        chief_complaint: chiefComplaint,
        diagnosis: diagnosis,
        clinical_notes: clinicalNotes,
        advice: advice,
        investigations_advised: investigationsAdvised,
        follow_up_date: followUpDate || undefined,
        items: validItems
      }

      const res = await axios.post('/prescriptions/', payload)
      toast.success('Prescription created successfully!')
      setPrintRx(res.data)

      // Reset form
      setChiefComplaint('')
      setDiagnosis('')
      setClinicalNotes('')
      setAdvice('')
      setInvestigationsAdvised('')
      setFollowUpDate('')
      setSelectedProtocolId('')
      setItems([{ medicine_name: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', instruction: 'After Food', route: 'Oral' }])
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to create prescription')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === selectedPatientId)
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-600 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Smart E-Prescription & AI Medical Scribe</h1>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            Voice-to-prescription dictation, 1-click clinical protocols, real-time drug safety, digital signature, and instant WhatsApp delivery
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl backdrop-blur-md border border-white/20">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'new'
                ? 'bg-white text-blue-800 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            New Consultation
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-white text-blue-800 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Prescription Records
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Innovative Doctor Toolbar: Voice Dictation, Protocols, and Signature */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-4 border border-indigo-800/40">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-400/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Doctor AI Clinical Assistant
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    100% Free / Native
                  </span>
                </h2>
                <p className="text-xs text-indigo-200/80">Speak naturally or choose 1-click clinical guidelines to complete prescriptions in seconds</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Voice Scribe Button */}
              <button
                type="button"
                onClick={startVoiceDictation}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md hover:shadow-red-500/25 transition-all cursor-pointer"
              >
                <Mic size={15} className="animate-pulse" />
                <span>Voice Scribe (Speak Rx)</span>
              </button>

              {/* Protocol Quick Dropdown */}
              <div className="relative">
                <select
                  value={selectedProtocolId}
                  onChange={e => handleSelectProtocol(e.target.value)}
                  className="bg-indigo-900/60 border border-indigo-400/30 text-white text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer appearance-none"
                >
                  <option value="" className="bg-slate-900 text-white">⚡ 1-Click Disease Protocol...</option>
                  {CLINICAL_PROTOCOLS.map((proto: ClinicalProtocol) => (
                    <option key={proto.id} value={proto.id} className="bg-slate-900 text-white">
                      {proto.category}: {proto.name}
                    </option>
                  ))}
                </select>
                <Zap size={13} className="absolute right-2.5 top-2.5 text-indigo-300 pointer-events-none" />
              </div>

              {/* Doctor Signature Pad Toggle */}
              <button
                type="button"
                onClick={() => setShowSignatureModal(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  doctorSignature
                    ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <PenTool size={14} />
                <span>{doctorSignature ? 'Signature Attached' : 'Draw Signature'}</span>
              </button>
            </div>
          </div>

          {/* Patient & Doctor Selection Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Patient <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50/50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patient by name, OP#, phone..."
                      value={patientSearch}
                      onChange={e => handlePatientSearch(e.target.value)}
                      className="w-full bg-transparent text-sm text-gray-800 focus:outline-none"
                    />
                  </div>

                  {patientSearch && !selectedPatientId && filteredPatients.length > 0 && (
                    <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {filteredPatients.map(p => (
                        <div
                          key={p.id}
                          onClick={() => selectPatient(p)}
                          className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                            <p className="text-xs text-gray-500">OP: {p.op_number} | Ph: {p.phone}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">
                            {p.age}y / {p.gender}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPatient && (
                  <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-900">{selectedPatient.name} ({selectedPatient.age}y, {selectedPatient.gender})</p>
                      <p className="text-xs text-blue-700">OP Number: {selectedPatient.op_number} | Phone: {selectedPatient.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedPatientId(''); setPatientSearch('') }}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Consulting Doctor */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Consulting Doctor <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50/50">
                  <Stethoscope className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(Number(e.target.value))}
                    className="w-full bg-transparent text-sm text-gray-800 focus:outline-none cursor-pointer"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDoctor && (
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Qualification: {selectedDoctor.qualification || 'MBBS'} | Specialization: {selectedDoctor.specialty}</span>
                    {doctorSignature && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <Check size={12} /> Stylus Signature Ready
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vitals Signs Strip */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-red-500" />
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Patient Vital Signs</h2>
              </div>
              <span className="text-[11px] text-gray-400">Can be dictated via Voice Scribe (e.g. "BP 120 over 80, pulse 72")</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">BP (Systolic)</label>
                <input
                  type="number"
                  placeholder="120"
                  value={bpSystolic}
                  onChange={e => setBpSystolic(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">mmHg</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">BP (Diastolic)</label>
                <input
                  type="number"
                  placeholder="80"
                  value={bpDiastolic}
                  onChange={e => setBpDiastolic(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">mmHg</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pulse Rate</label>
                <input
                  type="number"
                  placeholder="72"
                  value={pulse}
                  onChange={e => setPulse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">bpm</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">°F</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Weight</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="65"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">kg</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">SpO2</label>
                <input
                  type="number"
                  placeholder="99"
                  value={spo2}
                  onChange={e => setSpo2(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">%</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Blood Sugar</label>
                <input
                  type="number"
                  placeholder="110"
                  value={bloodSugar}
                  onChange={e => setBloodSugar(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">mg/dL</span>
              </div>
            </div>
          </div>

          {/* Clinical Findings & Diagnosis */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Chief Complaints / Symptoms
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Fever with chills since 3 days, dry cough, body aches..."
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Provisional / Final Diagnosis <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI)..."
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rx Medications Chart & Drug Safety Warnings */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-serif text-blue-700">℞</span>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Prescribed Medications</h2>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            {/* Real-time Drug Safety Alerts Banner */}
            {drugAlerts.length > 0 && (
              <div className="space-y-2">
                {drugAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                      alert.type === 'danger'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : alert.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    {alert.type === 'danger' ? (
                      <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    ) : alert.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-xs">
                      <p className="font-bold">{alert.title}</p>
                      <p className="mt-0.5 opacity-90">{alert.description}</p>
                      {alert.involvedDrugs.length > 0 && (
                        <p className="mt-1 font-mono text-[11px] font-semibold">
                          Drugs: {alert.involvedDrugs.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick autocomplete medicine suggestions */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-gray-400 self-center mr-1">Quick Select:</span>
              {medicines.slice(0, 6).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMedicine(items.length - 1, m)}
                  className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  + {m.brand_name}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-600 uppercase bg-gray-50/50">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3 w-1/3">Medicine Name & Strength</th>
                    <th className="py-2.5 px-3">Dosage</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Instructions</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3 text-xs font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="e.g. Paracetamol 650mg"
                          value={item.medicine_name}
                          onChange={e => handleItemChange(idx, 'medicine_name', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="1 tablet"
                          value={item.dosage}
                          onChange={e => handleItemChange(idx, 'dosage', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.frequency}
                          onChange={e => handleItemChange(idx, 'frequency', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="1-0-1">1-0-1 (Twice daily)</option>
                          <option value="1-1-1">1-1-1 (Thrice daily)</option>
                          <option value="1-0-0">1-0-0 (Morning only)</option>
                          <option value="0-0-1">0-0-1 (Night only)</option>
                          <option value="SOS">SOS (As needed)</option>
                          <option value="1 stat">1 STAT (Immediate)</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="5 days"
                          value={item.duration}
                          onChange={e => handleItemChange(idx, 'duration', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.instruction}
                          onChange={e => handleItemChange(idx, 'instruction', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                          <option value="With Milk">With Milk</option>
                          <option value="Empty Stomach">Empty Stomach</option>
                          <option value="Bedtime">Bedtime</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advice & Follow Up */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Advice / Dietary Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Drink plenty of warm fluids, steam inhalation twice a day, avoid cold food..."
                  value={advice}
                  onChange={e => setAdvice(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Lab Tests / Investigations Advised
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Complete Blood Count (CBC), Serum Creatinine..."
                  value={investigationsAdvised}
                  onChange={e => setInvestigationsAdvised(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">Recommended next review visit date</p>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              <span>All changes automatically verified with real-time safety & protocol rules</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                {isSubmitting ? 'Saving Prescription...' : 'Generate & Print Prescription'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Prescriptions History Tab */
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Consultations & Prescriptions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click to view printable slip, generate QR code, or share directly via WhatsApp</p>
            </div>
            <button
              onClick={fetchPrescriptionsList}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50/50">
                  <th className="py-3 px-4">Rx Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Diagnosis</th>
                  <th className="py-3 px-4 text-center">Meds</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {pastPrescriptions.map(rx => (
                  <tr key={rx.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">{rx.prescription_number}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(rx.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {rx.patient_name} <span className="text-xs text-gray-400">({rx.patient_age}y/{rx.patient_gender})</span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{rx.doctor_name}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{rx.diagnosis || 'General Checkup'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {rx.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPrintRx(rx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Print Prescription Slip"
                        >
                          <Printer size={13} /> Print
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(rx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Share Prescription on WhatsApp"
                        >
                          <MessageSquare size={13} /> WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pastPrescriptions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No prescriptions generated yet. Create one from the "New Consultation" tab!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Voice-to-Prescription Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <span className={`p-2.5 rounded-xl ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                  {isListening ? <Mic size={22} /> : <MicOff size={22} />}
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {isListening ? 'Listening to Clinical Dictation...' : 'Voice Dictation Paused'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isListening ? 'Speak naturally. Vitals, symptoms, & medicines will be auto-extracted.' : 'Review spoken transcript below and click apply.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { stopVoiceDictation(); setShowVoiceModal(false) }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Transcript Box */}
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 min-h-[120px] max-h-[220px] overflow-y-auto">
              {voiceTranscript ? (
                <p className="text-sm text-gray-800 leading-relaxed font-sans">{voiceTranscript}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Say something like: "Patient complaints of fever since 2 days. Blood pressure 120 over 80, pulse 76, temperature 100.4. Prescribe Paracetamol 650 twice daily for 3 days after food and Pantocid 40 once daily before food. Advice warm fluids. Follow up in 3 days."
                </p>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50/70 border border-blue-200/50 rounded-xl p-3 text-[11px] text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Volume2 size={13} /> Voice Commands Cheatsheet:
              </p>
              <ul className="list-disc list-inside text-blue-800 space-y-0.5">
                <li>Vitals: "BP 130/85", "Pulse 80", "Temp 101.2", "Weight 70", "SpO2 99"</li>
                <li>Meds: "Prescribe Paracetamol 650 twice daily for 5 days after food"</li>
                <li>Review: "Follow up in 3 days" or "Review after 1 week"</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={isListening ? stopVoiceDictation : startVoiceDictation}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? 'Pause Dictation' : 'Resume Speaking'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceTranscript('')}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={applyVoiceTranscript}
                  disabled={!voiceTranscript.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg disabled:opacity-40 transition-all cursor-pointer shadow-md"
                >
                  <Sparkles size={14} /> Auto-Fill Prescription Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <SignaturePad
            initialSignature={doctorSignature}
            doctorName={selectedDoctor?.name || 'Doctor'}
            onSave={handleSaveSignature}
            onClose={() => setShowSignatureModal(false)}
          />
        </div>
      )}

      {/* Official Prescription Print Modal */}
      {printRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/70">
              <span className="text-sm font-bold text-gray-700">Prescription Preview: {printRx.prescription_number}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareWhatsApp(printRx)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all cursor-pointer shadow-md"
                >
                  <MessageSquare size={14} /> Send via WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-md"
                >
                  <Printer size={14} /> Print Slip
                </button>
                <button
                  onClick={() => setPrintRx(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Prescription Document */}
            <div className="p-8 space-y-6 text-gray-900 font-sans" id="printable-prescription">
              {/* Header Letterhead */}
              <div className="border-b-2 border-blue-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">
                    {clinicSetting?.clinic_name || "City Care Hospital & Research Center"}
                  </h1>
                  <p className="text-xs text-blue-800 font-medium">
                    {clinicSetting?.tagline || "Advanced Clinical Excellence & Patient Care"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {clinicSetting?.address}, {clinicSetting?.city} | Ph: {clinicSetting?.phone}
                  </p>
                  {clinicSetting?.tax_id && (
                    <p className="text-[11px] text-gray-400 font-mono">Reg/Tax ID: {clinicSetting.tax_id}</p>
                  )}
                </div>

                <div className="text-right">
                  <h2 className="text-base font-bold text-gray-900">{printRx.doctor_name}</h2>
                  <p className="text-xs text-gray-600">{printRx.doctor_specialty}</p>
                  <p className="text-xs font-mono text-blue-700 font-semibold mt-1">Rx: {printRx.prescription_number}</p>
                  <p className="text-xs text-gray-500">Date: {new Date(printRx.date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Patient Bar */}
              <div className="grid grid-cols-4 gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs">
                <div>
                  <span className="text-gray-500">Patient:</span> <strong className="text-gray-900">{printRx.patient_name}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Age / Gender:</span> <strong>{printRx.patient_age}y / {printRx.patient_gender}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span> <strong>{new Date(printRx.date).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Consultation:</span> <strong>Outpatient (OP)</strong>
                </div>
              </div>

              {/* Vitals summary */}
              {(printRx.bp_systolic || printRx.pulse || printRx.temperature || printRx.weight_kg || printRx.spo2 || printRx.blood_sugar) && (
                <div className="flex flex-wrap gap-4 text-xs bg-gray-50 p-2.5 rounded border border-gray-200">
                  {printRx.bp_systolic && <span>BP: <strong>{printRx.bp_systolic}/{printRx.bp_diastolic} mmHg</strong></span>}
                  {printRx.pulse && <span>Pulse: <strong>{printRx.pulse} bpm</strong></span>}
                  {printRx.temperature && <span>Temp: <strong>{printRx.temperature} °F</strong></span>}
                  {printRx.weight_kg && <span>Weight: <strong>{printRx.weight_kg} kg</strong></span>}
                  {printRx.spo2 && <span>SpO2: <strong>{printRx.spo2}%</strong></span>}
                  {printRx.blood_sugar && <span>Sugar: <strong>{printRx.blood_sugar} mg/dL</strong></span>}
                </div>
              )}

              {/* Diagnosis & Complaints */}
              {(printRx.chief_complaint || printRx.diagnosis) && (
                <div className="space-y-1.5 text-xs">
                  {printRx.chief_complaint && (
                    <div>
                      <span className="font-bold text-gray-700 uppercase">Symptoms:</span>{' '}
                      <span className="text-gray-800">{printRx.chief_complaint}</span>
                    </div>
                  )}
                  {printRx.diagnosis && (
                    <div>
                      <span className="font-bold text-gray-700 uppercase">Diagnosis:</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{printRx.diagnosis}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rx Medicines Table */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-serif font-black text-blue-900">℞</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Prescribed Medications</span>
                </div>
                <table className="w-full text-xs border border-gray-200">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2 border text-left">#</th>
                      <th className="p-2 border text-left">Medicine</th>
                      <th className="p-2 border text-left">Dosage</th>
                      <th className="p-2 border text-left">Frequency</th>
                      <th className="p-2 border text-left">Duration</th>
                      <th className="p-2 border text-left">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printRx.items?.map((m, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 border font-bold text-gray-400">{i + 1}</td>
                        <td className="p-2 border font-semibold text-gray-900">{m.medicine_name}</td>
                        <td className="p-2 border">{m.dosage}</td>
                        <td className="p-2 border font-mono font-bold text-blue-700">{m.frequency}</td>
                        <td className="p-2 border">{m.duration}</td>
                        <td className="p-2 border text-gray-600">{m.instruction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Advice & Tests */}
              {(printRx.advice || printRx.investigations_advised) && (
                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  {printRx.advice && (
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                      <strong className="block text-gray-700 uppercase mb-1">Advice:</strong>
                      <p className="text-gray-800">{printRx.advice}</p>
                    </div>
                  )}
                  {printRx.investigations_advised && (
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                      <strong className="block text-gray-700 uppercase mb-1">Investigations:</strong>
                      <p className="text-gray-800">{printRx.investigations_advised}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Follow-up, QR Medicine Schedule & Doctor Signature */}
              <div className="pt-6 flex justify-between items-end border-t border-gray-200 mt-6">
                <div className="space-y-3">
                  {/* QR Code Section */}
                  {qrCodeDataUrl && (
                    <div className="flex items-center gap-2.5 bg-gray-50 p-2 rounded-xl border border-gray-200 max-w-xs">
                      <img src={qrCodeDataUrl} alt="Medicine Schedule QR" className="w-16 h-16 rounded" />
                      <div>
                        <p className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                          <QrCode size={12} className="text-blue-600" /> Patient QR Schedule
                        </p>
                        <p className="text-[9px] text-gray-500 leading-tight mt-0.5">
                          Scan with mobile camera for digital dosage timings and pill reminders
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    {printRx.follow_up_date && (
                      <p className="text-xs font-semibold text-blue-800">
                        Review Date: {new Date(printRx.follow_up_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">Powered by PMS SaaS Clinical Suite</p>
                  </div>
                </div>

                {/* Doctor Digital Signature Block */}
                <div className="text-center flex flex-col items-center">
                  {doctorSignature ? (
                    <div className="mb-1">
                      <img
                        src={doctorSignature}
                        alt="Doctor Digital Signature"
                        className="h-12 max-w-[150px] object-contain"
                      />
                      <div className="w-40 border-b border-gray-400"></div>
                    </div>
                  ) : (
                    <div className="w-40 border-b border-gray-400 mb-1 h-10"></div>
                  )}
                  <p className="text-xs font-bold text-gray-800">{printRx.doctor_name}</p>
                  <p className="text-[10px] text-gray-500">Authorized Medical Practitioner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Prescriptions
