import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react'
import { triggerHaptic } from '../utils/haptics'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installedSuccess, setInstalledSuccess] = useState(false)

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed)
    const isInStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    setIsStandalone(isInStandalone)
    if (isInStandalone) return

    // 2. Check if user dismissed prompt recently
    let isDismissed = false
    try {
      isDismissed = !!localStorage.getItem('rush_pwa_install_dismissed')
    } catch {
      // localStorage unavailable (e.g. private browsing, sandboxed iframe) — ignore
    }
    if (isDismissed) return

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent
    const isIOSDevice = /iPhone|iPad|iPod/.test(ua) && !window.MSStream
    setIsIOS(isIOSDevice)

    // 4. Android / Chrome beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS devices, display the custom iOS guide after a short delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 2500)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    triggerHaptic('success')
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setInstalledSuccess(true)
      setTimeout(() => setShowPrompt(false), 2000)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    triggerHaptic('light')
    setShowPrompt(false)
    try {
      localStorage.setItem('rush_pwa_install_dismissed', 'true')
    } catch {
      // localStorage unavailable — dismissal just won't persist across reloads
    }
  }

  if (isStandalone || !showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-md"
      >
        <div className="relative overflow-hidden rounded-3xl border border-[#00F0FF]/30 bg-[#0A0D15]/92 p-4 text-white shadow-[0_0_40px_rgba(0,240,255,0.25)] backdrop-blur-2xl">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#00F0FF]/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#7000FF]/20 blur-2xl" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Rush App Icon"
                className="h-12 w-12 rounded-2xl border border-white/20 object-cover shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-white">Install Rush App</h3>
                  <span className="rounded-full bg-[#3DFFC2]/20 px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider text-[#3DFFC2]">
                    Fast PWA
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-white/60">
                  Add to home screen for full-screen mobile app performance
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/50 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          {/* Installed Success Message */}
          {installedSuccess ? (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-[#3DFFC2]/40 bg-[#3DFFC2]/15 py-2.5 text-[12px] font-bold text-[#3DFFC2]">
              <CheckCircle2 size={16} /> Added to Home Screen!
            </div>
          ) : isIOS ? (
            /* iOS Installation Guide */
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[11.5px] leading-relaxed text-white/80">
              <p className="flex items-center gap-1.5 font-bold text-[#00F0FF]">
                <Sparkles size={14} /> iPhone / iPad Quick Install:
              </p>
              <ol className="mt-1.5 flex flex-col gap-1 text-[11px] text-white/70">
                <li className="flex items-center gap-1.5">
                  1. Tap the <Share size={13} className="text-[#00F0FF]" /> <strong>Share</strong> button in Safari toolbar
                </li>
                <li className="flex items-center gap-1.5">
                  2. Select <PlusSquare size={13} className="text-[#3DFFC2]" /> <strong>Add to Home Screen</strong>
                </li>
              </ol>
            </div>
          ) : (
            /* Android & Desktop 1-Tap Installer */
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-[12.5px] font-extrabold text-[#061018] transition-transform active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(90deg,#00F0FF,#3DFFC2)',
                  boxShadow: '0 0 20px rgba(0,240,255,0.4)',
                }}
              >
                <Download size={15} /> Install App Now
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[11.5px] font-bold text-white/60 hover:text-white"
              >
                Not Now
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
