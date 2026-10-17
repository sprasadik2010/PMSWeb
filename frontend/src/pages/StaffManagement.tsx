import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Users,
  UserPlus,
  X
} from 'lucide-react'
import { VoiceSwitch } from '../components/VoiceFloatingBar'

interface StaffMember {
  id: number
  username: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

interface Doctor {
  id: number
  name: string
  specialty: string
}

export const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  // Form State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('receptionist')
  const [doctorId, setDoctorId] = useState<number | ''>('')

  useEffect(() => {
    fetchStaff()
    fetchDoctors()
  }, [])

  const fetchStaff = async () => {
    try {
      const res = await axios.get('/staff/')
      setStaffList(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load clinic staff')
    }
  }

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/doctors/')
      setDoctors(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      toast.error('All fields are required')
      return
    }

    try {
      await axios.post('/staff/', {
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim(),
        role: role,
        doctor_id: role === 'doctor' && doctorId ? Number(doctorId) : undefined
      })
      toast.success(`Staff user "${username}" created!`)
      setShowAddModal(false)
      setUsername('')
      setPassword('')
      setFullName('')
      setRole('receptionist')
      setDoctorId('')
      fetchStaff()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create staff member')
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await axios.patch(`/staff/${id}/toggle-status`)
      toast.success(res.data.message)
      fetchStaff()
    } catch (err) {
      toast.error('Failed to toggle status')
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Clinic Staff & Role-Based Access Control (RBAC)</h1>
          </div>
          <p className="text-teal-100 text-sm mt-1">
            Delegate clinical workflows: create logins for Doctors, Receptionists, Billing Clerks, and Nurses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <VoiceSwitch compact label="Voice Typing" />
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal-950 font-bold rounded-xl text-sm shadow-md hover:bg-gray-100 transition-all cursor-pointer"
          >
            <UserPlus size={16} /> Add Staff Account
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Clinic Team Members</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50/50">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {staffList.map(member => (
                <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-900">{member.full_name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-blue-700">{member.username}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        member.role === 'doctor'
                          ? 'bg-purple-100 text-purple-800'
                          : member.role === 'receptionist'
                          ? 'bg-emerald-100 text-emerald-800'
                          : member.role === 'billing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(member.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        member.is_active
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {member.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No staff members added yet. Click "Add Staff Account" above to invite your clinic team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Create Staff Login</h2>
              <div className="flex items-center gap-2">
                <VoiceSwitch compact label="Voice" />
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Jenkins or John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Login Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. reception1, dr_sarah"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Assigned Staff Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="receptionist">Receptionist / Front Desk (Registration & Tokens)</option>
                  <option value="doctor">Doctor (Consultation, Vitals & Prescriptions)</option>
                  <option value="billing">Billing Clerk (OP & IP Cashier)</option>
                  <option value="nurse">Nurse (Vitals Recording & Ward Duty)</option>
                </select>
              </div>

              {role === 'doctor' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Link to Doctor Profile
                  </label>
                  <select
                    value={doctorId}
                    onChange={e => setDoctorId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Create Staff Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffManagement
