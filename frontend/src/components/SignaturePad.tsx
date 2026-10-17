import React, { useRef, useState, useEffect } from 'react'
import { Eraser, Check, PenTool, X } from 'lucide-react'

interface SignaturePadProps {
  initialSignature?: string | null
  onSave: (dataUrl: string | null) => void
  onClose?: () => void
  doctorName?: string
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  initialSignature,
  onSave,
  onClose,
  doctorName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [currentSignature, setCurrentSignature] = useState<string | null>(initialSignature || null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setup high DPI canvas
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (initialSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        setHasDrawn(true)
      }
      img.src = initialSignature
    }
  }, [initialSignature])

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.setPointerCapture(e.pointerId)
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId)
    }
    setIsDrawing(false)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasDrawn(false)
    setCurrentSignature(null)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) {
      onSave(null)
      if (onClose) onClose()
      return
    }
    const dataUrl = canvas.toDataURL('image/png')
    setCurrentSignature(dataUrl)
    onSave(dataUrl)
    if (onClose) onClose()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
            <PenTool size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Doctor Digital Signature</h3>
            <p className="text-[11px] text-gray-500">Sign with mouse, touch, or stylus pen</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-36 cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs">
            Draw your signature here...
          </div>
        )}
        <div className="absolute bottom-1 right-2 pointer-events-none text-[10px] text-gray-400 font-mono">
          {doctorName || 'Authorized Signatory'}
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <Eraser size={14} /> Clear
        </button>

        <div className="flex items-center gap-2">
          {currentSignature && (
            <span className="text-[11px] text-emerald-600 font-medium">Signature Active</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
          >
            <Check size={14} /> Apply Signature
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignaturePad
