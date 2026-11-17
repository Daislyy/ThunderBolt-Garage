import { Clock, Loader2, CheckCircle2, AlertCircle, Banknote } from 'lucide-react'

interface Props {
  status: 'Menunggu' | 'Diproses' | 'Menunggu Pembayaran' | 'Selesai' | 'Dibatalkan' | string
}

const statusConfigs: Record<string, { label: string; text: string; bg: string; border: string; dot: string; icon: typeof Clock }> = {
  Menunggu: {
    label: 'Menunggu',
    text: '#d97706',
    bg: '#fffbeb',
    border: '#fef3c7',
    dot: '#f59e0b',
    icon: Clock,
  },
  Diproses: {
    label: 'Diproses',
    text: '#2563eb',
    bg: '#eff6ff',
    border: '#dbeafe',
    dot: '#3b82f6',
    icon: Loader2,
  },
  'Menunggu Pembayaran': {
    label: 'Menunggu Pembayaran Cash',
    text: '#ea580c',
    bg: '#fff7ed',
    border: '#ffedd5',
    dot: '#f97316',
    icon: Banknote,
  },
  Selesai: {
    label: 'Selesai',
    text: '#059669',
    bg: '#ecfdf5',
    border: '#d1fae5',
    dot: '#10b981',
    icon: CheckCircle2,
  },
  Dibatalkan: {
    label: 'Dibatalkan',
    text: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    dot: '#ef4444',
    icon: AlertCircle,
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
