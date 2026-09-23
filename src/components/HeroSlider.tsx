import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const slides = [
  {
    image: '/images/resort.jpg',
    title: 'Thoughtful hospitality.\nBeautiful stays.',
    subtitle: 'Every room, every detail, every guest. Bring it all together in one place.',
    label: 'A little care. An exceptional stay.',
  },
  {
    image: '/images/suite.jpg',
    title: 'A warm welcome,\ndown to the last detail.',
    subtitle: 'Keep your rooms ready and make each arrival feel effortless.',
    label: 'Ready for your next arrival',
  },
  {
    image: '/images/resort.jpg',
    title: 'Your resort.\nWorking in harmony.',
    subtitle: 'A clear view of your property, with more time for the people who make it special.',
    label: 'One resort. Every perspective.',
  },
];

export default function HeroSlider({
  resortName,
  location,
  onExplore,
}: {
  resortName: string;
  location: string;
  onExplore: () => void;
}) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const slide = slides[index];
  return (
    <section className="hero-slider" aria-roledescription="carousel" aria-label="Your resort">
      <img className="hero-image" src={slide.image} alt="" fetchPriority="high" />
      <div className="hero-shade" />
      <motion.div
        key={index}
        className="hero-copy"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="hero-eyebrow"><span />{slide.label}</span>
        <h2>{slide.title}</h2>
        <p>{slide.subtitle}</p>
        <button type="button" className="hero-action" onClick={onExplore}>
          View room availability <ArrowUpRight size={16} />
        </button>
      </motion.div>
      <div className="hero-property">
        <MapPin size={14} />
        <span><strong>{resortName}</strong><small>{location}</small></span>
      </div>
      <div className="hero-controls" aria-label="Banner controls">
        <button type="button" aria-label="Previous slide" onClick={() => setIndex((index + slides.length - 1) % slides.length)}>
          <ChevronLeft size={17} />
        </button>
        <div className="hero-dots">
          {slides.map((slide, i) => (
            <button key={slide.label} type="button" aria-label={`Slide ${i + 1}`} aria-pressed={i === index} onClick={() => setIndex(i)}>
              <span />
            </button>
          ))}
        </div>
        <button type="button" aria-label="Next slide" onClick={() => setIndex((index + 1) % slides.length)}>
          <ChevronRight size={17} />
        </button>
      </div>
    </section>
  );
}
