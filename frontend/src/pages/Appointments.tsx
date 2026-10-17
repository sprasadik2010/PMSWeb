import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Calendar,
  Clock,
  Stethoscope,
  Plus,
  Tv,
  RefreshCw,
  Bell,
  X
} from 'lucide-react'

interface Appointment {
  id: number
  appointment_number: string
  patient_id: number
  doctor_id: number
  appointment_date: string
  time_slot: string
  token_number: number
  status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled'
  chief_complaint?: string
  notes?: string
  patient_name?: string
  patient_phone?: string
  doctor_name?: string
}

interface Patient {
  id: number
  name: string
  op_number: string
  phone: string
}

interface Doctor {
  id: number
  name: string
  specialty: string
}

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showBookModal, setShowBookModal] = useState<boolean>(false)
  const [showTvMode, setShowTvMode] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Booking Form State
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('')
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('')
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM')
  const [chiefComplaint, setChiefComplaint] = useState<string>('')
  const [patientSearch, setPatientSearch] = useState<string>('')

  useEffect(() => {
    fetchDoctorsAndPatients()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate, statusFilter])

  const fetchDoctorsAndPatients = async () => {
    try {
      const [ptsRes, docsRes] = await Promise.all([
        axios.get('/patients/'),
        axios.get('/doctors/')
      ])
      setPatients(ptsRes.data)
      setDoctors(docsRes.data)
      if (docsRes.data.length > 0) {
        setSelectedDoctorId(docsRes.data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (selectedDate) params.appointment_date = selectedDate
      if (statusFilter) params.status = statusFilter

      const res = await axios.get('/appointments/', { params })
      setAppointments(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !selectedDoctorId) {
      toast.error('Please select both a patient and a doctor')
      return
    }

    try {
      await axios.post('/appointments/', {
        patient_id: Number(selectedPatientId),
        doctor_id: Number(selectedDoctorId),
        appointment_date: bookingDate,
        time_slot: timeSlot,
        chief_complaint: chiefComplaint
      })
      toast.success('Appointment booked successfully!')
      setShowBookModal(false)
      setSelectedPatientId('')
      setChiefComplaint('')
      setPatientSearch('')
      fetchAppointments()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Booking failed')
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await axios.patch(`/appointments/${id}/status`, { status: newStatus })
      toast.success(`Patient marked as ${newStatus.replace('_', ' ')}`)
      fetchAppointments()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const filteredPatients = patients.filter(
    p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
         p.op_number.toLowerCase().includes(patientSearch.toLowerCase()) ||
         p.phone.includes(patientSearch)
  )

  const activeConsultation = appointments.find(a => a.status === 'in_consultation')
  const waitingPatients = appointments.filter(a => a.status === 'waiting')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Appointments & Live Queue Manager</h1>
          </div>
          <p className="text-emerald-100 text-sm mt-1">
            Doctor scheduling, front-desk token issuance, and patient waiting room display
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTvMode(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
          >
            <Tv size={16} /> Waiting Room TV Mode
          </button>
          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-emerald-900 font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Live Queue Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calling Now */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                In Consultation Now
              </span>
              {activeConsultation ? (
                <div className="mt-4">
                  <div className="text-5xl font-black font-mono">
                    Token #{activeConsultation.token_number}
                  </div>
                  <h3 className="text-lg font-bold mt-2">{activeConsultation.patient_name}</h3>
                  <p className="text-blue-100 text-xs">With {activeConsultation.doctor_name}</p>
                  <p className="text-xs text-blue-200 mt-1">Slot: {activeConsultation.time_slot}</p>
                </div>
              ) : (
                <div className="mt-6 text-blue-100">
                  <p className="text-2xl font-semibold">No patient inside</p>
                  <p className="text-xs text-blue-200 mt-1">Doctor is ready for the next token</p>
                </div>
              )}
            </div>
            <Bell className="h-8 w-8 text-white/30 animate-bounce" />
          </div>
        </div>

        {/* Up Next in Queue */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
              Next In Line
            </span>
            {waitingPatients.length > 0 ? (
              <div className="mt-4">
                <div className="text-4xl font-extrabold text-gray-900 font-mono">
                  Token #{waitingPatients[0].token_number}
                </div>
                <h3 className="text-base font-bold text-gray-800 mt-1">{waitingPatients[0].patient_name}</h3>
                <p className="text-xs text-gray-500">Doctor: {waitingPatients[0].doctor_name}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">Queue is currently clear</p>
            )}
          </div>
          {waitingPatients.length > 0 && (
            <button
              onClick={() => handleUpdateStatus(waitingPatients[0].id, 'in_consultation')}
              className="mt-4 w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Call Into Room &rarr;
            </button>
          )}
        </div>

        {/* Total Today Stats */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">
              Today's Schedule
            </span>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-black text-gray-900">{appointments.length}</p>
                <p className="text-xs text-gray-500">Total Booked</p>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-600">
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500">Consulted</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Waiting: {waitingPatients.length} patient(s) in lobby
          </p>
        </div>
      </div>

      {/* Appointment Filter & Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="in_consultation">In Consultation</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchAppointments}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50/50">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {appointments.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-extrabold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-900 text-xs">
                      #{apt.token_number}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800 text-xs">{apt.time_slot}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{apt.patient_name}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{apt.patient_phone || '-'}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-emerald-800">{apt.doctor_name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        apt.status === 'in_consultation'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : apt.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800'
                          : apt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {apt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {apt.status === 'waiting' && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'in_consultation')}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg"
                        >
                          Call
                        </button>
                      )}
                      {apt.status === 'in_consultation' && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg"
                        >
                          Complete
                        </button>
                      )}
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No appointments scheduled for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Book Patient Appointment</h2>
              <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              {/* Patient Search */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Patient <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search patient name, OP#..."
                    value={patientSearch}
                    onChange={e => {
                      setPatientSearch(e.target.value)
                      setSelectedPatientId('')
                    }}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {patientSearch && !selectedPatientId && filteredPatients.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-gray-100">
                      {filteredPatients.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientId(p.id)
                            setPatientSearch(`${p.name} (${p.op_number})`)
                          }}
                          className="p-2.5 hover:bg-emerald-50 cursor-pointer text-xs flex justify-between"
                        >
                          <span className="font-semibold text-gray-900">{p.name}</span>
                          <span className="text-gray-500 font-mono">{p.op_number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={e => setTimeSlot(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reason for Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Regular Follow-up, Skin allergy, Fever..."
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen TV Waiting Room Display */}
      {showTvMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-8 select-none">
          {/* TV Top Bar */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                <Stethoscope size={32} />
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-tight">OUTPATIENT CLINIC QUEUE</h1>
                <p className="text-slate-400 text-sm">Please proceed to your assigned doctor when your token is called</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-black font-mono text-emerald-400">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-slate-400">{new Date().toDateString()}</p>
              </div>
              <button
                onClick={() => setShowTvMode(false)}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                title="Exit TV Display"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* TV Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 py-8 overflow-hidden">
            {/* Active Consultation Box */}
            <div className="bg-gradient-to-br from-blue-900/60 to-indigo-950/80 rounded-3xl border-2 border-blue-500/50 p-10 flex flex-col justify-center items-center text-center shadow-2xl relative">
              <span className="absolute top-6 px-4 py-1.5 bg-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-full animate-pulse">
                NOW CALLING / CONSULTING
              </span>

              {activeConsultation ? (
                <div className="space-y-4">
                  <div className="text-8xl lg:text-9xl font-black font-mono text-white tracking-tighter drop-shadow-md">
                    #{activeConsultation.token_number}
                  </div>
                  <h2 className="text-4xl font-extrabold text-blue-200">{activeConsultation.patient_name}</h2>
                  <div className="inline-block px-5 py-2 bg-blue-800/60 rounded-xl text-lg font-semibold text-blue-100 border border-blue-400/30">
                    Dr. {activeConsultation.doctor_name}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <p className="text-4xl font-bold">READY FOR NEXT PATIENT</p>
                  <p className="text-lg text-slate-500 mt-2">Tokens will appear here when called</p>
                </div>
              )}
            </div>

            {/* Next in Waiting List */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-8 flex flex-col shadow-2xl overflow-hidden">
              <h3 className="text-xl font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
                <Clock className="text-amber-400" size={24} /> UPCOMING TOKENS (WAITING)
              </h3>

              <div className="divide-y divide-slate-800 overflow-y-auto flex-1 pr-2">
                {waitingPatients.map((apt) => (
                  <div key={apt.id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black font-mono px-4 py-2 bg-slate-800 rounded-xl text-amber-400">
                        #{apt.token_number}
                      </span>
                      <div>
                        <p className="text-xl font-bold text-white">{apt.patient_name}</p>
                        <p className="text-xs text-slate-400">Dr. {apt.doctor_name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Waiting ({apt.time_slot})
                    </span>
                  </div>
                ))}
                {waitingPatients.length === 0 && (
                  <div className="text-center py-16 text-slate-500 text-lg">
                    No patients currently waiting in line
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Appointments
