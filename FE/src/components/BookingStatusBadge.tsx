import { Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  status: 'Menunggu' | 'Diproses' | 'Selesai' | string
}

const statusConfigs: Record<string, { label: string; text: string; bg: string; border: string; dot: string; icon: typeof Clock }> = {
  Menunggu: {
    label: 'Menunggu',
    text: '#d97706',      // amber-600
    bg: '#fffbeb',        // amber-50
    border: '#fef3c7',    // amber-100
    dot: '#f59e0b',       // amber-500
    icon: Clock,
  },
  Diproses: {
    label: 'Diproses',
    text: '#2563eb',      // blue-600
    bg: '#eff6ff',        // blue-50
    border: '#dbeafe',    // blue-100
    dot: '#3b82f6',       // blue-500
    icon: Loader2,
  },
  Selesai: {
    label: 'Selesai',
    text: '#059669',      // emerald-600
    bg: '#ecfdf5',        // emerald-50
    border: '#d1fae5',    // emerald-100
    dot: '#10b981',       // emerald-500
    icon: CheckCircle2,
  },
}

export default function BookingStatusBadge({ status }: Props) {
  const config = statusConfigs[status] ?? {
    label: status,
    text: '#475569',      // slate-600
    bg: '#f8fafc',        // slate-50
    border: '#e2e8f0',    // slate-200
    dot: '#94a3b8',       // slate-400
    icon: AlertCircle,
  }

  const Icon = config.icon

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        fontSize: '10px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.dot,
        }}
      />
      <Icon style={{ width: '12px', height: '12px' }} />
      <span>{config.label}</span>
    </span>
  )
}
