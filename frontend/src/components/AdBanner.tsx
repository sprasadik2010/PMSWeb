import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Advertisement {
  id: number
  title: string
  description: string
  image_url?: string
  link_url?: string
}

export const AdBanner: React.FC = () => {
  const [ad, setAd] = useState<Advertisement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const fetchAd = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/ads/random')
      setAd(response.data)
    } catch (error) {
      console.error('Failed to fetch ad:', error)
      // Fallback default ad in case of network issue
      setAd({
        id: 0,
        title: "Upgrade to PMS Pro Premium",
        description: "Experience absolute speed. Remove ads, get advanced patient reports & priority support.",
        link_url: "/upgrade"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAd()
  }, [])

  const handleAdClick = async (e: React.MouseEvent) => {
    if (!ad) return
    
    // Register click on backend
    try {
      await axios.post(`/ads/${ad.id}/click`)
    } catch (err) {
      console.error('Failed to log ad click:', err)
    }

    if (ad.link_url) {
      if (ad.link_url.startsWith('/')) {
        e.preventDefault()
        navigate(ad.link_url)
      } else {
        window.open(ad.link_url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  if (isLoading || !ad) {
    return (
      <div className="animate-pulse bg-white/5 rounded-2xl p-4 border border-white/10 h-32 flex items-center justify-center">
        <span className="text-blue-300 text-sm">Loading sponsor...</span>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950/80 via-blue-900/60 to-indigo-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
      {/* Background glow animation */}
      <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-blue-200 border border-white/10 tracking-wide uppercase">
          Sponsored
        </span>
        <button 
          onClick={() => navigate('/upgrade')}
          className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline transition-colors cursor-pointer"
        >
          Remove Ads
        </button>
      </div>

      {ad.image_url && (
        <div className="w-full h-24 rounded-lg overflow-hidden mb-3 border border-white/5 relative">
          <img 
            src={ad.image_url} 
            alt={ad.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        </div>
      )}

      <div onClick={handleAdClick} className="cursor-pointer">
        <h4 className="text-white font-bold text-sm leading-snug group-hover:text-blue-200 transition-colors flex items-center gap-1.5">
          {ad.id === 0 && <Sparkles size={14} className="text-amber-400 shrink-0" />}
          {ad.title}
        </h4>
        <p className="text-blue-200/80 text-[11px] mt-1 leading-relaxed line-clamp-3">
          {ad.description}
        </p>
        
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-white group-hover:translate-x-1 transition-transform duration-300">
          <span className="flex items-center gap-1 text-cyan-400">
            Learn More <ArrowRight size={12} />
          </span>
          {ad.id === 0 && (
            <span className="flex items-center gap-0.5 text-emerald-400">
              <ShieldCheck size={12} /> Certified Pro
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
