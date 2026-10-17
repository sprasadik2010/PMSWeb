import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  FileCheck2,
  Plus,
  Printer,
  X
} from 'lucide-react'
import { VoiceSwitch } from '../components/VoiceFloatingBar'

interface DischargeSummary {
  id: number
  summary_number: string
  patient_id: number
  doctor_id: number
  admission_date: string
  discharge_date: string
  final_diagnosis: string
  treatment_summary: string
  condition_at_discharge: string
  discharge_medications?: string
  follow_up_instructions?: string
  created_by?: string
  created_at: string
  patient_name?: string
  doctor_name?: string
}

interface Patient {
  id: number
  name: string
  ip_number?: string
  is_ip: boolean
  age: string
  gender: string
  phone: string
}

interface Doctor {
  id: number
  name: string
  specialty: string
}

export const DischargeSummaries: React.FC = () => {
  const [summaries, setSummaries] = useState<DischargeSummary[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [printSummary, setPrintSummary] = useState<DischargeSummary | null>(null)
  const [clinicSetting, setClinicSetting] = useState<any>(null)

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('')
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('')
  const [admissionDate, setAdmissionDate] = useState<string>('')
  const [dischargeDate, setDischargeDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [finalDiagnosis, setFinalDiagnosis] = useState<string>('')
  const [treatmentSummary, setTreatmentSummary] = useState<string>('')
  const [conditionAtDischarge, setConditionAtDischarge] = useState<string>('Stable and Recovered')
  const [dischargeMedications, setDischargeMedications] = useState<string>('')
  const [followUpInstructions, setFollowUpInstructions] = useState<string>('')
  const [patientSearch, setPatientSearch] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sumRes, ptsRes, docsRes, setRes] = await Promise.all([
        axios.get('/discharge-summaries/'),
        axios.get('/patients/'),
        axios.get('/doctors/'),
        axios.get('/clinic-settings/')
      ])
      setSummaries(sumRes.data)
      setPatients(ptsRes.data)
      setDoctors(docsRes.data)
      setClinicSetting(setRes.data)
      if (docsRes.data.length > 0) {
        setSelectedDoctorId(docsRes.data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !selectedDoctorId) {
      toast.error('Please select patient and doctor')
      return
    }
    if (!admissionDate || !dischargeDate || !finalDiagnosis || !treatmentSummary) {
      toast.error('Please fill in all mandatory clinical fields')
      return
    }

    try {
      const res = await axios.post('/discharge-summaries/', {
        patient_id: Number(selectedPatientId),
        doctor_id: Number(selectedDoctorId),
        admission_date: admissionDate,
        discharge_date: dischargeDate,
        final_diagnosis: finalDiagnosis,
        treatment_summary: treatmentSummary,
        condition_at_discharge: conditionAtDischarge,
        discharge_medications: dischargeMedications,
        follow_up_instructions: followUpInstructions
      })
      toast.success('Discharge summary generated!')
      setShowCreateModal(false)
      fetchData()
      setPrintSummary(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create summary')
    }
  }

  const filteredPatients = patients.filter(
    p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
         (p.ip_number && p.ip_number.toLowerCase().includes(patientSearch.toLowerCase()))
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-800 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <FileCheck2 className="h-6 w-6 text-white" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Inpatient (IP) Discharge Summaries</h1>
          </div>
          <p className="text-purple-100 text-sm mt-1">
            Clinical course documentation, hospital discharge instructions, and treatment records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <VoiceSwitch compact label="Voice Typing" />
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-950 font-bold rounded-xl text-sm shadow-md hover:bg-gray-100 transition-all cursor-pointer"
          >
            <Plus size={16} /> New Discharge Summary
          </button>
        </div>
      </div>

      {/* Summaries List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Generated Summaries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50/50">
                <th className="py-3 px-4">Summary #</th>
                <th className="py-3 px-4">Discharge Date</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Final Diagnosis</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {summaries.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-purple-700">{s.summary_number}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(s.discharge_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{s.patient_name}</td>
                  <td className="py-3 px-4 text-gray-700">{s.doctor_name}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{s.final_diagnosis}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {s.condition_at_discharge}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setPrintSummary(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      <Printer size={13} /> View & Print
                    </button>
                  </td>
                </tr>
              ))}
              {summaries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No discharge summaries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Prepare Inpatient Discharge Summary</h2>
              <div className="flex items-center gap-2">
                <VoiceSwitch compact label="Voice" />
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Patient <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search admitted patient..."
                  value={patientSearch}
                  onChange={e => {
                    setPatientSearch(e.target.value)
                    setSelectedPatientId('')
                  }}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                {patientSearch && !selectedPatientId && filteredPatients.length > 0 && (
                  <div className="mt-1 bg-white border rounded-xl shadow-lg max-h-36 overflow-y-auto divide-y">
                    {filteredPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id)
                          setPatientSearch(`${p.name} (IP: ${p.ip_number || 'N/A'})`)
                        }}
                        className="p-2.5 hover:bg-purple-50 cursor-pointer text-xs flex justify-between"
                      >
                        <span className="font-semibold text-gray-900">{p.name}</span>
                        <span className="text-gray-500">{p.ip_number || 'OP'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Attending Consultant <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Admission Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={e => setAdmissionDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Discharge Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dischargeDate}
                    onChange={e => setDischargeDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Clinical Details */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Final Clinical Diagnosis <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Acute appendicitis with localized peritonitis..."
                  value={finalDiagnosis}
                  onChange={e => setFinalDiagnosis(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Treatment / Surgical Course Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Patient underwent laparoscopic appendectomy on 12/10 under GA. Post-op course was uneventful..."
                  value={treatmentSummary}
                  onChange={e => setTreatmentSummary(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Condition At Discharge</label>
                <input
                  type="text"
                  value={conditionAtDischarge}
                  onChange={e => setConditionAtDischarge(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discharge Medications</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tab. Augmentin 625mg 1-0-1 x 5 days, Tab. Pantocid 40mg 1-0-0 x 7 days..."
                  value={dischargeMedications}
                  onChange={e => setDischargeMedications(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Follow-up & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Suture removal after 7 days in surgery OPD, avoid strenuous heavy lifting..."
                  value={followUpInstructions}
                  onChange={e => setFollowUpInstructions(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save & Generate Summary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <span className="text-xs font-bold text-gray-500 uppercase">Hospital Discharge Summary</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-800"
                >
                  <Printer size={14} /> Print Summary
                </button>
                <button onClick={() => setPrintSummary(null)} className="p-2 text-gray-400 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-6 text-gray-900">
              <div className="border-b-2 border-purple-900 pb-4 text-center">
                <h1 className="text-2xl font-black uppercase text-purple-950">
                  {clinicSetting?.clinic_name || "City Care Hospital"}
                </h1>
                <p className="text-xs text-purple-800 font-semibold">PATIENT DISCHARGE SUMMARY</p>
                <p className="text-xs text-gray-500">{clinicSetting?.address}, {clinicSetting?.city} | Ph: {clinicSetting?.phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                <p><strong>Patient Name:</strong> {printSummary.patient_name}</p>
                <p><strong>Summary No:</strong> <span className="font-mono font-bold text-purple-800">{printSummary.summary_number}</span></p>
                <p><strong>Admission Date:</strong> {new Date(printSummary.admission_date).toLocaleDateString()}</p>
                <p><strong>Discharge Date:</strong> {new Date(printSummary.discharge_date).toLocaleDateString()}</p>
                <p><strong>Consultant Doctor:</strong> {printSummary.doctor_name}</p>
                <p><strong>Condition at Discharge:</strong> <span className="text-emerald-800 font-bold">{printSummary.condition_at_discharge}</span></p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-bold uppercase text-gray-700 mb-1">Final Diagnosis:</h3>
                  <p className="p-3 bg-gray-50 rounded-lg text-sm font-semibold">{printSummary.final_diagnosis}</p>
                </div>

                <div>
                  <h3 className="font-bold uppercase text-gray-700 mb-1">Hospital Course & Treatment Summary:</h3>
                  <p className="p-3 bg-gray-50 rounded-lg leading-relaxed whitespace-pre-wrap">{printSummary.treatment_summary}</p>
                </div>

                {printSummary.discharge_medications && (
                  <div>
                    <h3 className="font-bold uppercase text-gray-700 mb-1">Discharge Medications:</h3>
                    <p className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">{printSummary.discharge_medications}</p>
                  </div>
                )}

                {printSummary.follow_up_instructions && (
                  <div>
                    <h3 className="font-bold uppercase text-gray-700 mb-1">Follow-up & Advice:</h3>
                    <p className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">{printSummary.follow_up_instructions}</p>
                  </div>
                )}
              </div>

              <div className="pt-12 flex justify-between items-end border-t border-gray-200">
                <p className="text-[10px] text-gray-400">PMS Pro SaaS Hospital Information System</p>
                <div className="text-center">
                  <div className="w-40 border-b border-gray-400 mb-1"></div>
                  <p className="text-xs font-bold">{printSummary.doctor_name}</p>
                  <p className="text-[10px] text-gray-500">Authorized Medical Officer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DischargeSummaries
