import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, User, Eye, EyeOff, LogIn, AlertCircle, ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react'
import { useCustomerAuth } from '../hooks/useCustomerAuth'

export default function UserLoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, register, loginDemo } = useCustomerAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Nama lengkap wajib diisi.')
        await register(name, email, password)
      } else {
        await login(email, password)
      }
      navigate('/user/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    loginDemo()
    navigate('/user/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#fff',
    }}>
      {/* Left Brand Panel (Identical to Admin Login) */}
      <motion.div
        className="tb-login-left-banner"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: '45%',
          background: '#1A1A2E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Ambient radial glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(249,115,22,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 1 }}
        >
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(249,115,22,0.35)',
          }}>
            <Zap size={36} color="#fff" fill="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              ThunderBolt
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginTop: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Customer Portal
            </p>
          </div>
        </motion.div>

        {/* Bottom decoration */}
        <div style={{
          position: 'absolute', bottom: 32, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 6,
        }}>
          <div style={{ width: 24, height: 3, borderRadius: 2, background: '#F97316' }} />
          <div style={{ width: 8, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Top navigation row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#64748B',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={14} />
              <span>Beranda</span>
            </Link>

            <Link
              to="/login"
              style={{
                color: '#F97316',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              Portal Admin Bengkel →
            </Link>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              borderRadius: 10,
              padding: 4,
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: !isRegister ? '#FFFFFF' : 'transparent',
                color: !isRegister ? '#1A1A2E' : '#64748B',
                boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: isRegister ? '#FFFFFF' : 'transparent',
                color: isRegister ? '#1A1A2E' : '#64748B',
                boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Daftar Baru
            </button>
          </div>

          {/* Title Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ marginBottom: 28 }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A2E', letterSpacing: '-0.02em', marginBottom: 6 }}>
              {isRegister ? 'Daftar Akun Pelanggan' : 'Login Pelanggan'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
              {isRegister
                ? 'Buat akun untuk riwayat servis & estimasi transparan'
                : 'Masuk ke portal pelanggan ThunderBolt Garage'}
            </p>
          </motion.div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.8125rem', color: '#DC2626' }}>{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Name field (if register) */}
            {isRegister && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#475569', marginBottom: 7 }}>
                  Nama Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Contoh: Muhammad Attar"
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '12px 14px 12px 42px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      fontFamily: 'Inter, sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#475569', marginBottom: 7 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="pelanggan@email.com"
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '12px 14px 12px 42px',
                    color: '#1E293B',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#475569', marginBottom: 7 }}>
                Kata Sandi
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder={isRegister ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '12px 44px 12px 42px',
                    color: '#1E293B',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#FDBA74' : '#F97316',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(249,115,22,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                  {isRegister ? 'Mendaftarkan...' : 'Masuk...'}
                </>
              ) : (
                <>
                  {isRegister ? <UserPlus size={17} /> : <LogIn size={17} />}
                  <span>{isRegister ? 'Buat Akun Pelanggan' : 'Masuk ke Dashboard'}</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Demo Login Option */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleDemoLogin}
              style={{
                width: '100%',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: '0.8125rem',
                color: '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <CheckCircle2 size={15} color="#F97316" />
              <span>Masuk Cepat (Akun Demo)</span>
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: '#94A3B8' }}>
            Butuh bantuan servis? Hubungi CS WhatsApp{' '}
            <a href="https://wa.me/6281319233748" target="_blank" rel="noreferrer" style={{ color: '#F97316', textDecoration: 'none', fontWeight: 600 }}>
              0813-1923-3748
            </a>
          </p>

          {/* Bottom dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A1A2E' }} />
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) {
          .tb-login-left-banner {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
