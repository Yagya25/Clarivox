import { useState, useRef, useEffect } from 'react'
import { api } from '../api'
import './VoiceRecorder.css'

export default function VoiceRecorder({ onTranscription, onStateChange, disabled }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  useEffect(() => {
    if (onStateChange) onStateChange({ isRecording, isTranscribing })
  }, [isRecording, isTranscribing, onStateChange])

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const [analyser, setAnalyser] = useState(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analyser for waveform
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyserNode = audioCtx.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      setAnalyser(analyserNode)

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setIsTranscribing(true)
        try {
          const result = await api.transcribeAudio(blob)
          onTranscription(result.text)
        } catch (err) {
          console.error('Transcription failed:', err)
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      setIsRecording(false)
      setAnalyser(null)
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }

  // Waveform visualization
  useEffect(() => {
    if (!analyser || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = 'rgba(10, 10, 26, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
        gradient.addColorStop(0, '#6c5ce7')
        gradient.addColorStop(1, '#a855f7')
        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [analyser])

  return (
    <div className="voice-recorder">
      {isRecording && (
        <canvas
          ref={canvasRef}
          className="voice-recorder__waveform"
          width={200}
          height={40}
        />
      )}

      <button
        className={`voice-recorder__btn ${isRecording ? 'voice-recorder__btn--recording' : ''} ${isTranscribing ? 'voice-recorder__btn--transcribing' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isTranscribing}
        id="voice-record-btn"
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isTranscribing ? (
          <div className="spinner" style={{ width: 18, height: 18 }} />
        ) : isRecording ? (
          <span className="voice-recorder__stop-icon">■</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </button>

      {isRecording && (
        <span className="voice-recorder__label">
          <span className="voice-recorder__dot"></span>
          Recording...
        </span>
      )}
      {isTranscribing && (
        <span className="voice-recorder__label">Transcribing...</span>
      )}
    </div>
  )
}
