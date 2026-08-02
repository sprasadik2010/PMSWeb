import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ShieldAlert, 
  Users, 
  Megaphone, 
  BarChart3, 
  Activity, 
  Coins, 
  MousePointerClick, 
  TrendingUp, 
  UserX, 
  UserCheck, 
  Edit3, 
  Trash2, 
  Plus, 
  ToggleLeft, 
  ToggleRight,
  ExternalLink,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface UserAdmin {
  id: number
  username: string
  full_name: string
  role: string
  is_active: boolean
  ad_free: boolean
  subscription_tier: string
  created_at: string
  patients_count: number
  doctors_count: number
  bills_count: number
}

interface AdAdmin {
  id: number
  title: string
  description: string
  image_url?: string
  link_url?: string
  is_active: boolean
  impressions: number
  clicks: number
  ctr: number
  created_at: string
}

interface AdminStats {
  total_users: number
  free_users: number
  premium_users: number
  total_doctors: number
  total_patients: number
  total_op_bills: number
  total_ip_bills: number
  total_revenue: number
  total_ad_impressions: number
  total_ad_clicks: number
  ad_ctr_percent: number
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'ads'>('stats')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserAdmin[]>([])
  const [ads, setAds] = useState<AdAdmin[]>([])
  
  // Search and filter states
  const [userSearch, setUserSearch] = useState('')
  
  // Loading states
  const [loading, setLoading] = useState(true)

  // Ad Form states
  const [showAdModal, setShowAdModal] = useState(false)
  const [editingAd, setEditingAd] = useState<AdAdmin | null>(null)
  const [adTitle, setAdTitle] = useState('')
  const [adDescription, setAdDescription] = useState('')
  const [adImageUrl, setAdImageUrl] = useState('')
  const [adLinkUrl, setAdLinkUrl] = useState('')
  const [adIsActive, setAdIsActive] = useState(true)
  const [adSubmitting, setAdSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'stats') {
        const res = await axios.get('/admin/stats')
        setStats(res.data)
      } else if (activeTab === 'users') {
        const res = await axios.get('/admin/users')
        setUsers(res.data)
      } else if (activeTab === 'ads') {
        const res = await axios.get('/admin/ads/details')
        setAds(res.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err)
      toast.error(err.response?.data?.detail || 'Unauthorized: Admin privileges required')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  // Users Handlers
  const toggleUserActive = async (userId: number, currentActive: boolean) => {
    try {
      await axios.put(`/admin/users/${userId}/status`, { is_active: !currentActive })
      toast.success('Clinic status updated successfully')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update clinic status')
    }
  }

  const toggleUserTier = async (userId: number, currentTier: string) => {
    const newTier = currentTier === 'premium' ? 'free' : 'premium'
    try {
      await axios.put(`/admin/users/${userId}/status`, { subscription_tier: newTier })
      toast.success(`Clinic upgraded to ${newTier} successfully`)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update clinic tier')
    }
  }

  // Ads Handlers
  const handleOpenAdModal = (ad: AdAdmin | null = null) => {
    if (ad) {
      setEditingAd(ad)
      setAdTitle(ad.title)
      setAdDescription(ad.description)
      setAdImageUrl(ad.image_url || '')
      setAdLinkUrl(ad.link_url || '')
      setAdIsActive(ad.is_active)
    } else {
      setEditingAd(null)
      setAdTitle('')
      setAdDescription('')
      setAdImageUrl('')
      setAdLinkUrl('')
      setAdIsActive(true)
    }
    setShowAdModal(true)
  }

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adTitle || !adDescription) {
      toast.error('Ad Title and Description are required')
      return
    }

    setAdSubmitting(true)
    try {
      const adPayload = {
        title: adTitle,
        description: adDescription,
        image_url: adImageUrl || null,
        link_url: adLinkUrl || null,
        is_active: adIsActive
      }

      if (editingAd) {
        await axios.put(`/admin/ads/${editingAd.id}`, adPayload)
        toast.success('Ad updated successfully')
      } else {
        await axios.post('/admin/ads', adPayload)
        toast.success('Ad created successfully')
      }
      setShowAdModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save ad')
    } finally {
      setAdSubmitting(false)
    }
  }

  const handleDeleteAd = async (adId: number) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return
    try {
      await axios.delete(`/admin/ads/${adId}`)
      toast.success('Ad deleted successfully')
      fetchData()
    } catch (err: any) {
      toast.error('Failed to delete ad')
    }
  }

  const toggleAdActiveStatus = async (ad: AdAdmin) => {
    try {
      await axios.put(`/admin/ads/${ad.id}`, {
        title: ad.title,
        description: ad.description,
        image_url: ad.image_url || null,
        link_url: ad.link_url || null,
        is_active: !ad.is_active
      })
      toast.success('Ad status toggled')
      fetchData()
    } catch (err: any) {
      toast.error('Failed to toggle status')
    }
  }

  // Filtered Clinics list
  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <div className="py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-600 to-indigo-700 rounded-3xl p-6 lg:p-8 text-white mb-8 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <ShieldAlert size={32} />
            SaaS Central Admin Panel
          </h1>
          <p className="text-rose-100 text-sm mt-2 max-w-xl">
            Monitor clinical workspace growth, configure active marketing ads, view platform conversions and manage clinic accounts.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 hidden md:block">
          <p className="text-xs text-rose-200">Security Clearance</p>
          <p className="text-sm font-bold">ROOT SUPERADMIN</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 mb-8 gap-4">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'stats' 
              ? 'border-red-600 text-red-700' 
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 size={18} /> SaaS Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users' 
              ? 'border-red-600 text-red-700' 
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users size={18} /> Clinics / Tenants ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ads' 
              ? 'border-red-600 text-red-700' 
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Megaphone size={18} /> Ad Manager ({ads.length})
        </button>
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: SAAS ANALYTICS */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-8">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 text-xs font-semibold uppercase">Platform Revenue</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">${stats.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                    <p className="text-[11px] text-gray-500 mt-2">Combined clinic billing logs</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                    <Coins size={24} />
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 text-xs font-semibold uppercase">Premium Upgrade Rate</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">
                      {stats.total_users > 0 ? ((stats.premium_users / stats.total_users) * 100).toFixed(1) : 0}%
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-2">
                      {stats.premium_users} premium out of {stats.total_users} clinics
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                    <TrendingUp size={24} />
                  </div>
                </div>

                {/* Active Clinics */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 text-xs font-semibold uppercase">Clinics / Tenants</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total_users}</h3>
                    <p className="text-[11px] text-gray-500 mt-2">{stats.free_users} Free Tier / {stats.premium_users} Premium</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                    <Users size={24} />
                  </div>
                </div>

                {/* Ad Clicks and CTR */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 text-xs font-semibold uppercase">Ad Conversion (CTR)</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.ad_ctr_percent.toFixed(2)}%</h3>
                    <p className="text-[11px] text-gray-500 mt-2">{stats.total_ad_clicks} clicks / {stats.total_ad_impressions} views</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
                    <MousePointerClick size={24} />
                  </div>
                </div>
              </div>

              {/* Scoped Data Analytics Panel */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Activity className="text-indigo-600" /> Platform Data Volume
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-gray-500 text-xs uppercase font-medium">Patients</span>
                    <p className="text-3xl font-black text-gray-800 mt-1">{stats.total_patients}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-gray-500 text-xs uppercase font-medium">Doctors</span>
                    <p className="text-3xl font-black text-gray-800 mt-1">{stats.total_doctors}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-gray-500 text-xs uppercase font-medium">OP Bills</span>
                    <p className="text-3xl font-black text-gray-800 mt-1">{stats.total_op_bills}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-gray-500 text-xs uppercase font-medium">IP Bills</span>
                    <p className="text-3xl font-black text-gray-800 mt-1">{stats.total_ip_bills}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICS / TENANTS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 max-w-md shadow-sm">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search clinics by name or username..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-xs font-bold">
                        <th className="p-4">Clinic / Owner</th>
                        <th className="p-4">Workspace</th>
                        <th className="p-4">Tier Status</th>
                        <th className="p-4 text-center">Registrations (D / P / B)</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">No clinics matched your query.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            {/* Clinic / Owner */}
                            <td className="p-4">
                              <div className="font-bold text-gray-900">{u.full_name}</div>
                              <div className="text-xs text-gray-500">Owner ID: #{u.id}</div>
                            </td>
                            {/* Username */}
                            <td className="p-4">
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-mono text-xs">@{u.username}</span>
                              <div className="text-[10px] text-gray-400 mt-1">Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                            </td>
                            {/* Tier */}
                            <td className="p-4">
                              {u.subscription_tier === 'premium' ? (
                                <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                                  <Sparkles size={12} className="text-amber-500" /> Premium (Ad-Free)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full font-semibold">
                                  Standard (Ads)
                                </span>
                              )}
                            </td>
                            {/* Stats */}
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-bold" title="Doctors">{u.doctors_count}D</span>
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold" title="Patients">{u.patients_count}P</span>
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold" title="Bills">{u.bills_count}B</span>
                              </div>
                            </td>
                            {/* Active */}
                            <td className="p-4">
                              {u.is_active ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                  <CheckCircle size={14} /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold">
                                  <AlertCircle size={14} /> Suspended
                                </span>
                              )}
                            </td>
                            {/* Actions */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleUserTier(u.id, u.subscription_tier)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                                    u.subscription_tier === 'premium'
                                      ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                                      : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white'
                                  }`}
                                >
                                  {u.subscription_tier === 'premium' ? 'Downgrade' : 'Force Upgrade'}
                                </button>
                                
                                {u.role !== 'superadmin' && (
                                  <button
                                    onClick={() => toggleUserActive(u.id, u.is_active)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      u.is_active 
                                        ? 'bg-red-50 hover:bg-red-100 text-red-600' 
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                                    }`}
                                    title={u.is_active ? 'Suspend Workspace' : 'Activate Workspace'}
                                  >
                                    {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AD CATALOG MANAGER */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Advertisement Catalog</h3>
                <button
                  onClick={() => handleOpenAdModal(null)}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold px-4 py-2.5 rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer text-sm"
                >
                  <Plus size={16} /> Add Advertisement
                </button>
              </div>

              {/* Ad Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.length === 0 ? (
                  <div className="col-span-full bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500">
                    No advertisements configured. Click "Add Advertisement" to populate.
                  </div>
                ) : (
                  ads.map((ad) => (
                    <div 
                      key={ad.id} 
                      className={`bg-white border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                        ad.is_active ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'
                      }`}
                    >
                      {/* Image Preview */}
                      <div className="w-full h-36 bg-gray-100 relative overflow-hidden">
                        {ad.image_url ? (
                          <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <Megaphone size={36} />
                            <span className="text-xs mt-1">Text-Only Ad Mock</span>
                          </div>
                        )}
                        
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-sm text-xs font-bold text-gray-700">
                          {ad.is_active ? (
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                          )}
                          {ad.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-gray-900 leading-snug">{ad.title}</h4>
                          <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-3">{ad.description}</p>
                          
                          {ad.link_url && (
                            <a 
                              href={ad.link_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 mt-2.5"
                            >
                              Target Link <ExternalLink size={10} />
                            </a>
                          )}
                        </div>

                        {/* Ad Stats summary */}
                        <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-3.5 my-4 text-center">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-medium">Views</span>
                            <div className="font-bold text-gray-800 text-sm mt-0.5">{ad.impressions.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-medium">Clicks</span>
                            <div className="font-bold text-gray-800 text-sm mt-0.5">{ad.clicks.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-medium">CTR</span>
                            <div className="font-bold text-indigo-600 text-sm mt-0.5">{ad.ctr.toFixed(1)}%</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-auto">
                          <button
                            onClick={() => toggleAdActiveStatus(ad)}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
                          >
                            {ad.is_active ? (
                              <>
                                <ToggleRight className="text-emerald-500" size={20} /> Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="text-gray-400" size={20} /> Activate
                              </>
                            )}
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenAdModal(ad)}
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Ad details"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteAd(ad.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Ad"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Ad Creator/Editor Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-2xl mb-2">
                <Megaphone size={24} />
              </div>
              <h3 className="text-xl font-bold">{editingAd ? 'Edit Advertisement' : 'Create Advertisement'}</h3>
              <p className="text-rose-100 text-xs mt-1">Deploy sponsored campaigns targeting free-tier clinics</p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdSubmit} className="p-6 space-y-4">
              {/* Ad Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="e.g.littmann Stethoscope Discount"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase">Ad Description</label>
                <textarea
                  required
                  rows={3}
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                  placeholder="Provide brief high-converting copy..."
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase">Image Banner URL (Optional)</label>
                <input
                  type="url"
                  value={adImageUrl}
                  onChange={(e) => setAdImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              {/* Target Link */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase">Target Redirect Link</label>
                <input
                  type="text"
                  value={adLinkUrl}
                  onChange={(e) => setAdLinkUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="e.g. /upgrade or https://yourproduct.com"
                />
              </div>

              {/* Is Active toggle */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <span className="text-xs font-bold text-gray-700 uppercase">Campaign Status</span>
                <button
                  type="button"
                  onClick={() => setAdIsActive(!adIsActive)}
                  className="flex items-center gap-1 text-sm font-semibold cursor-pointer"
                >
                  {adIsActive ? (
                    <>
                      <ToggleRight className="text-green-500" size={24} /> Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="text-gray-400" size={24} /> Inactive
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdModal(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all cursor-pointer text-center text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adSubmitting}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer text-center text-sm flex items-center justify-center gap-1.5"
                >
                  {adSubmitting ? 'Saving...' : (editingAd ? 'Update Ad' : 'Publish Ad')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
