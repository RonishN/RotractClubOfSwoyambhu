import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import TeamSection from '../components/TeamSection';
import InitiativesSection from '../components/InitiativesSection';
import EventsSection from '../components/EventsSection';
import ContactSection from '../components/ContactSection';
import SandyDivider from '../components/SandyDivider';
import Footer from '../components/Footer';
import FeaturedEventModal from '../components/FeaturedEventModal';
import { getPublicContent, getPublicEvents } from '../api/client';

export default function Home() {
  const [content, setContent]   = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [featuredEvent, setFeaturedEvent] = useState(null);

  useEffect(() => {
    getPublicContent()
      .then((result) => {
        setContent(result?.websiteData || {});
      })
      .catch(() => {
        setContent({});
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Load public events to find featured one
    getPublicEvents()
      .then((events) => {
        const featured = Array.isArray(events)
          ? events.find(ev => ev.isPriority && ev.status !== 'Draft') || null
          : null;
        setFeaturedEvent(featured);
      })
      .catch(() => setFeaturedEvent(null));
  }, []);

  return (
    <>
      <Header />
      <main>
        <HeroSection  content={content || {}} isLoading={isLoading} />
        <AboutSection content={content || {}} isLoading={isLoading} />
        <TeamSection  content={content || {}} isLoading={isLoading} />
        <InitiativesSection content={content || {}} isLoading={isLoading} />
        <EventsSection      content={content || {}} />
        <ContactSection />
      </main>
      <Footer />
      <MobileBottomNav />
      <FeaturedEventModal event={featuredEvent} />
    </>
  );
}
