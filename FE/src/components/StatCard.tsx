import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
  delay?: number
  trend?: string
}

export default function StatCard({ label, value, icon: Icon, color, delay = 0, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '22px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow effect background */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: color,
        filter: 'blur(30px)',
        opacity: 0.15,
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={24} color={color} strokeWidth={1.75} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <TrendingUp size={12} color="#22C55E" />
            <span style={{ fontSize: '0.6875rem', color: '#22C55E', fontWeight: 500 }}>{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
