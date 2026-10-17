import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

interface ActiveInputInfo {
  label: string
  name: string
  placeholder: string
  type: string
}

interface VoiceContextType {
  isVoiceEnabled: boolean
  isListening: boolean
  isSupported: boolean
  transcript: string
  activeInputInfo: ActiveInputInfo | null
  lastSpokenText: string
  toggleVoice: () => void
  setVoiceEnabled: (enabled: boolean) => void
  retryListening: () => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

// Web Speech API interface declarations for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

// Convert common spoken number words into digits for number/phone inputs
function parseSpokenNumbers(text: string): string {
  const numberWords: { [key: string]: string } = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    ten: '10', eleven: '11', twelve: '12', thirteen: '13',
    fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17',
    eighteen: '18', nineteen: '19', twenty: '20', thirty: '30',
    forty: '40', fifty: '50', sixty: '60', seventy: '70',
    eighty: '80', ninety: '90', hundred: '100'
  }

  // If text is composed of spoken digits, e.g. "nine eight four five"
  const words = text.toLowerCase().split(/\s+/)
  let allDigits = true
  let digitString = ''
  for (const w of words) {
    if (numberWords[w] !== undefined && numberWords[w].length === 1) {
      digitString += numberWords[w]
    } else if (/^\d+$/.test(w)) {
      digitString += w
    } else {
      allDigits = false
      break
    }
  }

  if (allDigits && digitString.length > 0) {
    return digitString
  }

  return text
}

// React-compatible input injection utility
export function insertTextIntoActiveInput(
  input: HTMLInputElement | HTMLTextAreaElement,
  textToInsert: string,
  append = false
) {
  if (!input) return

  let formattedText = textToInsert.trim()
  if (!formattedText) return

  const inputType = (input.type || '').toLowerCase()
  const isNumberOrPhone = inputType === 'number' || inputType === 'tel' ||
    (input.name && /phone|mobile|age|bp|pulse|temp|weight|sugar|token/i.test(input.name)) ||
    (input.id && /phone|mobile|age|bp|pulse|temp|weight|sugar|token/i.test(input.id))

  if (isNumberOrPhone) {
    formattedText = parseSpokenNumbers(formattedText)
    // If number input, extract only digits and decimals
    if (inputType === 'number') {
      const match = formattedText.match(/[-+]?[0-9]*\.?[0-9]+/)
      if (match) formattedText = match[0]
    }
  } else {
    // Capitalize first letter of names or sentences
    if (formattedText.length > 0) {
      formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1)
    }
  }

  let finalValue = formattedText
  if (append && input.value && input.value.trim().length > 0) {
    finalValue = `${input.value.trim()} ${formattedText}`
  }

  // Use the native prototype setter so React synthetic events update state
  const isTextArea = input instanceof HTMLTextAreaElement
  const prototype = isTextArea ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')

  if (descriptor && descriptor.set) {
    descriptor.set.call(input, finalValue)
  } else {
    input.value = finalValue
  }

  // Dispatch events so React's onChange and form validation triggers
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))

  // Visual confirmation feedback
  input.classList.add('ring-2', 'ring-emerald-500', 'border-emerald-500')
  setTimeout(() => {
    input.classList.remove('ring-2', 'ring-emerald-500', 'border-emerald-500')
  }, 900)
}

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVoiceEnabled, setIsVoiceEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('pms_voice_dictation_enabled') === 'true'
  })
  const [isListening, setIsListening] = useState<boolean>(false)
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [transcript, setTranscript] = useState<string>('')
  const [lastSpokenText, setLastSpokenText] = useState<string>('')
  const [activeInputInfo, setActiveInputInfo] = useState<ActiveInputInfo | null>(null)

  const activeTargetRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const isVoiceEnabledRef = useRef<boolean>(isVoiceEnabled)
  const restartTimerRef = useRef<any>(null)

  // Keep ref synchronized
  useEffect(() => {
    isVoiceEnabledRef.current = isVoiceEnabled
    localStorage.setItem('pms_voice_dictation_enabled', isVoiceEnabled ? 'true' : 'false')
  }, [isVoiceEnabled])

  // Track focused text inputs across any page
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const input = target as HTMLInputElement | HTMLTextAreaElement
        const inputType = (input.type || '').toLowerCase()

        if (!['checkbox', 'radio', 'file', 'hidden', 'button', 'submit', 'reset'].includes(inputType)) {
          activeTargetRef.current = input

          // Extract human-friendly label
          let label = ''
          if (input.id) {
            const labelElem = document.querySelector(`label[for="${input.id}"]`)
            if (labelElem) label = labelElem.textContent || ''
          }
          if (!label) {
            const parentLabel = input.closest('label')
            if (parentLabel) label = parentLabel.textContent || ''
          }
          if (!label && input.labels && input.labels.length > 0) {
            label = input.labels[0].textContent || ''
          }
          if (!label && input.placeholder) label = input.placeholder
          if (!label && input.name) label = input.name
          label = (label || 'Text Field').replace(/[*:]/g, '').trim()

          setActiveInputInfo({
            label: label || 'Active Field',
            name: input.name || input.id || '',
            placeholder: input.placeholder || '',
            type: inputType || 'text'
          })
        }
      }
    }

    document.addEventListener('focusin', handleFocusIn, true)
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true)
    }
  }, [])

  // Start Speech Recognition
  const startRecognition = useCallback(() => {
    const win = window as IWindow
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setIsSupported(false)
      toast.error('Voice-to-Text is not supported by your current browser. Try Chrome, Edge, or Safari.')
      return
    }

    // Stop existing instance if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (err) {
        // Ignore
      }
    }

    try {
      const recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US' // English only
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            finalTranscript += item[0].transcript
          } else {
            interimTranscript += item[0].transcript
          }
        }

        const liveText = (finalTranscript || interimTranscript).trim()
        if (liveText) {
          setTranscript(liveText)
        }

        if (finalTranscript.trim()) {
          const spoken = finalTranscript.trim()
          setLastSpokenText(spoken)

          // If an input is focused, insert text into it
          let targetInput = activeTargetRef.current
          if (!targetInput || !document.contains(targetInput)) {
            // If nothing is focused, check activeElement
            const activeElem = document.activeElement
            if (activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA')) {
              targetInput = activeElem as HTMLInputElement | HTMLTextAreaElement
              activeTargetRef.current = targetInput
            } else {
              // Fallback to first visible text/search input on page
              const candidate = document.querySelector<HTMLInputElement>(
                'input[type="text"]:not([disabled]), input[type="search"]:not([disabled]), textarea:not([disabled])'
              )
              if (candidate) {
                targetInput = candidate
                targetInput.focus()
                activeTargetRef.current = targetInput
              }
            }
          }

          if (targetInput) {
            // Fill the value
            insertTextIntoActiveInput(targetInput, spoken, false)
            toast.success(`Voice typed: "${spoken}"`, {
              id: 'voice-typed-toast',
              duration: 1500,
              icon: '🎙️'
            })
          } else {
            toast('Please tap any text or search box to dictate into it', {
              id: 'voice-no-input-toast',
              icon: 'ℹ️',
              duration: 2000
            })
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false)
          setIsVoiceEnabledState(false)
          toast.error('Microphone access was denied. Please allow microphone permissions in your browser.')
        } else if (event.error === 'network') {
          // Normal on intermittent network or speech engine pause
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        // If voice is still enabled, restart recognition after short delay
        if (isVoiceEnabledRef.current) {
          clearTimeout(restartTimerRef.current)
          restartTimerRef.current = setTimeout(() => {
            if (isVoiceEnabledRef.current) {
              try {
                recognition.start()
              } catch (e) {
                // Ignore duplicate start errors
              }
            }
          }, 300)
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      console.error('Failed to start voice recognition:', err)
      setIsListening(false)
    }
  }, [])

  const stopRecognition = useCallback(() => {
    clearTimeout(restartTimerRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (err) {
        // Ignore
      }
      recognitionRef.current = null
    }
    setIsListening(false)
    setTranscript('')
  }, [])

  // Manage recognition based on isVoiceEnabled
  useEffect(() => {
    const win = window as IWindow
    const supported = !!(win.SpeechRecognition || win.webkitSpeechRecognition)
    setIsSupported(supported)

    if (isVoiceEnabled && supported) {
      startRecognition()
    } else {
      stopRecognition()
    }

    return () => {
      stopRecognition()
    }
  }, [isVoiceEnabled, startRecognition, stopRecognition])

  const toggleVoice = () => {
    const nextState = !isVoiceEnabled
    setIsVoiceEnabledState(nextState)
    if (nextState) {
      toast.success('Voice Dictation ON (English). Tap any field and speak!', {
        icon: '🎙️',
        duration: 3000
      })
    } else {
      toast('Voice Dictation turned OFF', {
        icon: '🔇',
        duration: 2000
      })
    }
  }

  const setVoiceEnabled = (enabled: boolean) => {
    setIsVoiceEnabledState(enabled)
  }

  const retryListening = () => {
    if (isVoiceEnabled) {
      startRecognition()
    }
  }

  return (
    <VoiceContext.Provider
      value={{
        isVoiceEnabled,
        isListening,
        isSupported,
        transcript,
        activeInputInfo,
        lastSpokenText,
        toggleVoice,
        setVoiceEnabled,
        retryListening
      }}
    >
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}
