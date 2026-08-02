import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Sparkles, 
  Check, 
  CreditCard, 
  Lock, 
  Loader2, 
  ArrowLeft, 
  Building,
  RefreshCw
} from 'lucide-react'

const PricingUpgrade: React.FC = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [showCheckout, setShowCheckout] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Card details state
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple validation
    if (!cardName || cardNumber.length < 16 || expiry.length < 4 || cvv.length < 3) {
      toast.error('Please fill in valid credit card information')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await axios.post('/auth/upgrade')
      updateUser(response.data)
      toast.success('🎉 Upgrade successful! Welcome to PMS Pro Premium.')
      setShowCheckout(false)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Upgrade failed:', err)
      toast.error(err.response?.data?.detail || 'Upgrade failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDowngradeForTesting = async () => {
    setIsSubmitting(true)
    try {
      const response = await axios.post('/auth/downgrade')
      updateUser(response.data)
      toast.success('Reverted to Free Ad-Supported Tier for testing.')
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Downgrade failed:', err)
      toast.error('Downgrade failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>
        
        {user?.subscription_tier === 'premium' && (
          <button 
            onClick={handleDowngradeForTesting}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
            title="SaaS Testing Feature: Reset to Free ad tier"
          >
            <RefreshCw size={12} className={isSubmitting ? 'animate-spin' : ''} />
            Reset to Free Tier (Developer Test)
          </button>
        )}
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
          <Sparkles className="text-amber-500 animate-pulse" size={32} />
          Choose the Perfect Tier for Your Clinic
        </h1>
        <p className="text-gray-600 text-lg mt-3 max-w-xl mx-auto">
          Scale your patient care, manage outpatient/inpatient operations, and streamline medical records seamlessly.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Standard Tier</h3>
              <p className="text-gray-500 text-sm mt-1">Ideal for small or testing clinics</p>
            </div>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black text-gray-900">$0</span>
              <span className="text-gray-500 font-medium">/ month</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Check className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <span className="text-gray-700 text-sm">OP/IP Patient Registrations</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <span className="text-gray-700 text-sm">Standard Billing & Receipt Generation</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <span className="text-gray-700 text-sm">Community Health Reports</span>
              </div>
              <div className="flex items-start gap-3 opacity-60">
                <Check className="text-gray-400 shrink-0 mt-0.5" size={18} />
                <span className="text-gray-600 text-sm">Ad-Supported Environment (Sponsored)</span>
              </div>
            </div>
          </div>

          <button 
            disabled={user?.subscription_tier === 'free'}
            onClick={() => handleDowngradeForTesting()}
            className={`w-full py-3.5 rounded-2xl font-semibold text-center transition-all ${
              user?.subscription_tier === 'free'
                ? 'bg-gray-100 text-gray-500 cursor-default'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm'
            }`}
          >
            {user?.subscription_tier === 'free' ? 'Current Tier' : 'Downgrade to Standard'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-gradient-to-b from-indigo-900 to-blue-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between border-2 border-indigo-500 scale-105">
          <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
            <Sparkles size={12} /> Popular
          </div>
          
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold">Ad-Free Pro</h3>
              <p className="text-indigo-200 text-sm mt-1">Professional patient care with zero interruptions</p>
            </div>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black">$29</span>
              <span className="text-indigo-200 font-medium">/ month</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Check className="text-cyan-400 shrink-0 mt-0.5" size={18} />
                <span className="text-indigo-100 text-sm">100% Ad-Free Clinical App</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-cyan-400 shrink-0 mt-0.5" size={18} />
                <span className="text-indigo-100 text-sm">Unlimited Patients & Doctor Entries</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-cyan-400 shrink-0 mt-0.5" size={18} />
                <span className="text-indigo-100 text-sm">Premium Multi-doctor Revenue Reports</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-cyan-400 shrink-0 mt-0.5" size={18} />
                <span className="text-indigo-100 text-sm">Priority Clinical Support (24/7)</span>
              </div>
            </div>
          </div>

          <button 
            disabled={user?.subscription_tier === 'premium'}
            onClick={() => setShowCheckout(true)}
            className={`w-full py-4 rounded-2xl font-bold text-center transition-all shadow-lg hover:shadow-xl cursor-pointer ${
              user?.subscription_tier === 'premium'
                ? 'bg-indigo-950/50 text-indigo-300 border border-indigo-800 cursor-default'
                : 'bg-gradient-to-r from-cyan-400 to-teal-400 text-indigo-950 hover:from-cyan-300 hover:to-teal-300 transform hover:-translate-y-0.5'
            }`}
          >
            {user?.subscription_tier === 'premium' ? 'Clinic Upgraded' : 'Go Ad-Free Pro'}
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-2xl mb-2">
                <CreditCard size={24} />
              </div>
              <h3 className="text-xl font-bold">Secure Checkout</h3>
              <p className="text-blue-100 text-xs mt-1">Secure clinical workspace subscription via PMS Payments</p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpgrade} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3 mb-2">
                <Building className="text-indigo-600" size={20} />
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-medium">Subscribing Clinic</p>
                  <p className="text-sm font-bold text-gray-800">{user?.full_name}</p>
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="e.g. Dr. John Doe"
                />
              </div>

              {/* Card Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono tracking-wider"
                    placeholder="4242 4242 4242 4242"
                  />
                  <CreditCard className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '')
                      if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4)
                      }
                      setExpiry(val)
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-center"
                    placeholder="MM/YY"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">CVV / CVN</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-center"
                    placeholder="•••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 border border-gray-100 p-2.5 rounded-xl mt-4">
                <span className="flex items-center gap-1 font-medium">
                  <Lock size={12} className="text-emerald-500" />
                  SSL Encrypted Payment
                </span>
                <span>$29.00 billed monthly</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all cursor-pointer text-center text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer text-center text-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Upgrading...
                    </>
                  ) : (
                    'Pay & Upgrade'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingUpgrade
