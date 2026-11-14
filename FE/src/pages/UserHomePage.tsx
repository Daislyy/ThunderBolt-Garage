import { useState } from 'react'
import { motion } from 'framer-motion'
import UserNavbar from '../user/UserNavbar'
import UserHero from '../user/UserHero'
import UserAbout from '../user/UserAbout'
import UserQuickFilter from '../user/UserQuickFilter'
import UserOffers from '../user/UserOffers'
import UserWhyUs from '../user/UserWhyUs'
import UserServices from '../user/UserServices'
import UserSpareparts from '../user/UserSpareparts'
import UserBooking from '../user/UserBooking'
import UserTracking from '../user/UserTracking'
import UserBannerCTA from '../user/UserBannerCTA'
import UserWorkshopInfo from '../user/UserWorkshopInfo'
import UserFooter from '../user/UserFooter'
import '../user/user.css'

export default function UserHomePage() {
  const [selectedService, setSelectedService] = useState<string>('Servis Berkala & Ganti Oli')
  const [trackingQuery, setTrackingQuery] = useState<string>('')

  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSelectService = (serviceName: string) => {
    setSelectedService(serviceName)
    scrollTo('booking')
  }

  const handleQuickFilter = (serviceName: string) => {
    setSelectedService(serviceName)
    scrollTo('booking')
  }

  const handleBookingCreated = (bookingCode: string, platNomor: string) => {
    setTrackingQuery(bookingCode || platNomor)
    setTimeout(() => {
      scrollTo('tracking')
    }, 600)
  }

  return (
    <div className="tb-user-page">
      {/* Clean Modern Navbar */}
      <UserNavbar onBookClick={() => scrollTo('booking')} />

      <main>
        {/* Hero Section with animated elements */}
        <UserHero
          onBookClick={() => scrollTo('booking')}
          onTrackClick={() => scrollTo('tracking')}
        />

        {/* Quick Filter / Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserQuickFilter onSearch={handleQuickFilter} />
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserAbout onLearnMoreClick={() => scrollTo('layanan')} />
        </motion.div>

        {/* Best Offers 6-Card Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserOffers onSelectOffer={handleSelectService} />
        </motion.div>

        {/* Why Choose Us */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserWhyUs />
        </motion.div>

        {/* Full Service Catalog */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserServices onSelectService={handleSelectService} />
        </motion.div>

        {/* Spareparts Catalog */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserSpareparts />
        </motion.div>

        {/* Booking Form (Syncs to Admin) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserBooking
            preselectedService={selectedService}
            onBookingSuccess={handleBookingCreated}
          />
        </motion.div>

        {/* Tracking Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserTracking initialQuery={trackingQuery} />
        </motion.div>

        {/* Call To Action Banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserBannerCTA onBookClick={() => scrollTo('booking')} />
        </motion.div>

        {/* Workshop Map & Location */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <UserWorkshopInfo />
        </motion.div>
      </main>

      {/* Footer */}
      <UserFooter />
    </div>
  )
}
