import { useState } from 'react'
import { Car, Bike } from 'lucide-react'

// Mapping brand name to Simple Icons slug (https://cdn.simpleicons.org/<slug>/<color>)
const brandSlugMap: Record<string, string> = {
  // --- MOBIL (CARS) ---
  toyota: 'toyota',
  honda: 'honda',
  suzuki: 'suzuki',
  mitsubishi: 'mitsubishi',
  nissan: 'nissan',
  daihatsu: 'daihatsu',
  bmw: 'bmw',
  mercedes: 'mercedes',
  'mercedes-benz': 'mercedes',
  hyundai: 'hyundai',
  mazda: 'mazda',
  wuling: 'wuling',
  ford: 'ford',
  chevrolet: 'chevrolet',
  volkswagen: 'volkswagen',
  vw: 'volkswagen',
  audi: 'audi',
  kia: 'kia',
  tesla: 'tesla',
  porsche: 'porsche',
  ferrari: 'ferrari',
  lamborghini: 'lamborghini',
  subaru: 'subaru',
  lexus: 'lexus',
  jeep: 'jeep',
  peugeot: 'peugeot',

  // --- MOTOR (MOTORCYCLES) ---
  yamaha: 'yamaha',
  kawasaki: 'kawasaki',
  vespa: 'vespa',
  piaggio: 'piaggio',
  ducati: 'ducati',
  ktm: 'ktm',
  harley: 'harleydavidson',
  'harley-davidson': 'harleydavidson',
  harleydavidson: 'harleydavidson',
  'royal enfield': 'royalenfield',
  royalenfield: 'royalenfield',
  aprilia: 'aprilia',
  triumph: 'triumph',
  benelli: 'benelli',
  husqvarna: 'husqvarna',
  'indian motorcycle': 'indianmotorcycle',
  indian: 'indianmotorcycle',
  'moto guzzi': 'motoguzzi',
  motoguzzi: 'motoguzzi',
  'mv agusta': 'mvagusta',
  mvagusta: 'mvagusta',
  tvs: 'tvs',
  bajaj: 'bajaj',
  sym: 'sym',
  kymco: 'kymco',
  alva: 'alva',
  gesits: 'gesits',
  viar: 'viar',
  yadea: 'yadea',
  niu: 'niu',
}


const motorcycleBrands = new Set([
  'yamaha', 'kawasaki', 'vespa', 'piaggio', 'ducati', 'ktm',
  'harley', 'harley-davidson', 'harleydavidson', 'royal enfield',
  'royalenfield', 'aprilia', 'triumph', 'benelli', 'husqvarna',
  'indian', 'indian motorcycle', 'moto guzzi', 'mv agusta',
  'tvs', 'bajaj', 'sym', 'kymco', 'alva', 'gesits', 'viar', 'yadea', 'niu'
])

interface BrandLogoProps {
  brand: string
  size?: string
  containerSize?: string
  color?: string
}

export default function BrandLogo({
  brand,
  size = '1.125rem',
  containerSize = '2.25rem',
  color = 'F97316'
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false)
  const normalized = (brand || '').trim().toLowerCase()
  const slug = brandSlugMap[normalized] || normalized.replace(/[^a-z0-9]/g, '')
  const isMotorcycle = motorcycleBrands.has(normalized) || normalized.includes('motor') || normalized.includes('bike')

  const logoUrl = `https://cdn.simpleicons.org/${slug}/${color}`

  return (
    <div
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius: '0.75rem',
        backgroundColor: '#fff7ed',
        border: '1px solid #ffedd5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        padding: '0.35rem'
      }}
    >
      {!hasError && slug ? (
        <img
          src={logoUrl}
          alt={brand}
          style={{ width: size, height: size, objectFit: 'contain' }}
          onError={() => setHasError(true)}
        />
      ) : isMotorcycle ? (
        <Bike style={{ width: size, height: size, color: `#${color}` }} />
      ) : (
        <Car style={{ width: size, height: size, color: `#${color}` }} />
      )}
    </div>
  )
}
