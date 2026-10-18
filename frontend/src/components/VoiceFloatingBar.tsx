import React from 'react'
import { Mic, MicOff, X } from 'lucide-react'
import { useVoice } from '../contexts/VoiceContext'

export const VoiceSwitch: React.FC<{ compact?: boolean; label?: string }> = ({ 
  compact = false,
  label = "Voice Dictation"
}) => {
  const { isVoiceEnabled, toggleVoice, isSupported } = useVoice()

  if (!isSupported) {
    return null
  }

  return (
    <button
      type="button"
      onClick={toggleVoice}
      className={`group relative inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-200 border cursor-pointer select-none ${
        isVoiceEnabled
          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm'
      }`}
      title={isVoiceEnabled ? 'Voice Dictation is ON (English). Click to turn OFF' : 'Turn ON English Voice Dictation'}
    >
      <div className="relative flex items-center justify-center">
        {isVoiceEnabled ? (
          <>
            <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <Mic size={compact ? 16 : 18} className="relative z-10 text-white" />
          </>
        ) : (
          <MicOff size={compact ? 16 : 18} className="text-gray-400 group-hover:text-gray-600" />
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs font-bold">
        <span>{label}</span>
        <span className={`px-1.5 py-0.2 rounded-md text-[10px] uppercase tracking-wide font-extrabold ${
          isVoiceEnabled ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          EN
        </span>
      </div>

      {/* Switch Track / Pill */}
      <div className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 ml-1 ${
        isVoiceEnabled ? 'bg-emerald-400' : 'bg-gray-300'
      }`}>
        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          isVoiceEnabled ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </div>
    </button>
  )
}

export const VoiceFloatingBar: React.FC = () => {
  const { 
    isVoiceEnabled, 
    isListening, 
    activeInputInfo, 
    transcript, 
    lastSpokenText, 
    toggleVoice,
    isSupported 
  } = useVoice()

  if (!isSupported || !isVoiceEnabled) {
    return null
  }

  return (
    <div className="hidden md:block fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
      <div className="bg-gray-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3">
        {/* Pulsing Mic Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <span className="absolute -inset-1.5 rounded-full bg-emerald-500 opacity-70 animate-ping"></span>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg">
              <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Voice Typing Active
              </span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                English Only • Free
              </span>
            </div>

            {/* Target Field Info */}
            <p className="text-xs text-gray-200 font-medium truncate mt-0.5">
              {activeInputInfo ? (
                <>
                  Typing into: <span className="font-bold text-white underline decoration-emerald-400">{activeInputInfo.label}</span>
                </>
              ) : (
                <span className="text-gray-400 italic">Tap any textbox to speak into it (e.g. Patient Name)</span>
              )}
            </p>

            {/* Live Transcript Preview */}
            {(transcript || lastSpokenText) && (
              <p className="text-[11px] text-emerald-300 truncate font-mono mt-0.5">
                "{transcript || lastSpokenText}"
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleVoice}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            title="Turn Off Voice Dictation"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
