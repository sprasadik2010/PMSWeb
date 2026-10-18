import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Building2,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

export const ClinicSettings: React.FC = () => {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    clinic_name: '',
    tagline: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    email: '',
    tax_id: '',
    currency_symbol: '₹',
    logo_url: '',
    terms_conditions: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/clinic-settings/')
      setFormData(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load clinic settings')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.put('/clinic-settings/', formData)
      toast.success('Clinic settings and branding updated!')
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-2.5 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-gradient-to-r from-slate-800 via-indigo-900 to-blue-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 sm:p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Hospital & Clinic Profile</h1>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 hidden sm:block">
            Configure your official clinic letterhead, billing header, contact details, and tax registration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2">Clinic Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Hospital / Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. City Multi-Speciality Clinic & Research"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. 24x7 Emergency Care & Diagnostics"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Phone Number(s)
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@cityclinic.com"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Plot 45, Medical Center Road"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Legal, Tax & Billing Config */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2">Billing & Tax Configuration</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tax / GSTIN Number
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  placeholder="e.g. 36AAAAA0000A1Z5"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Currency Symbol
                </label>
                <select
                  name="currency_symbol"
                  value={formData.currency_symbol}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="$">$ (USD - US Dollar)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Bill Footer Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  name="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={handleChange}
                  placeholder="Terms printed at the bottom of customer receipts..."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {saving ? 'Saving Changes...' : 'Save Clinic Profile'}
              </button>
            </div>
          </div>
        </form>

        {/* Live Bill Header Preview Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="text-amber-500" size={14} /> Live Print Header Preview
            </h3>

            <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/70 text-center space-y-1">
              <h4 className="text-lg font-black text-gray-900 uppercase">
                {formData.clinic_name || 'Your Clinic Name'}
              </h4>
              <p className="text-xs text-blue-700 font-semibold">
                {formData.tagline || 'Clinic Tagline'}
              </p>
              <p className="text-[11px] text-gray-500">
                {formData.address || 'Address Line'}, {formData.city || 'City'}
              </p>
              <p className="text-[11px] text-gray-500">
                Ph: {formData.phone || 'Phone'} | {formData.email || 'Email'}
              </p>
              {formData.tax_id && (
                <p className="text-[10px] font-mono text-gray-400 mt-1">
                  Tax / Reg ID: {formData.tax_id}
                </p>
              )}
            </div>

            <p className="text-[11px] text-gray-400 mt-3 text-center">
              This header automatically appears at the top of all printed OP Bills, IP Invoices, Prescriptions, and Discharge Summaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClinicSettings
