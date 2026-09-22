import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const slides = [
  {
    id: 's1',
    image: '/images/resort.jpg',
    title: 'Where every stay feels like coming home',
    subtitle: 'Tailored experiences, impeccable service, and coastal calm',
  },
  {
    id: 's2',
    image: '/images/suite.jpg',
    title: 'Sunset dinners and private moments',
    subtitle: 'Curated dining experiences on the shoreline',
  },
  {
    id: 's3',
    image: '/images/resort.jpg',
    title: 'Your sanctuary by the sea',
    subtitle: 'Spacious suites, private terraces, and lingering mornings',
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-full overflow-hidden rounded-2xl hero-slider" style={{ height: 420 }}>
      <AnimatePresence initial={false} mode="wait">
        {slides.map((s, i) =>
          i === index ? (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <motion.img
                src={s.image}
                alt={s.title}
                className="object-cover w-full h-full"
                initial={{ scale: 1.04 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10 }}
                style={{ willChange: 'transform' }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(4,18,12,0.9) 0%, rgba(20,34,28,0.7) 35%, rgba(24,38,30,0.15) 70%, rgba(24,38,30,0.02) 100%)' }} />
              <div className="absolute left-8 top-20 max-w-2xl text-white">
                <motion.h1
                  initial={{ y: 22, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.12, duration: 0.6 }}
                  className="font-serif text-4xl leading-tight"
                >
                  {s.title}
                </motion.h1>
                <motion.p
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.22, duration: 0.6 }}
                  className="mt-4 text-sm text-amber-100"
                >
                  {s.subtitle}
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }} className="mt-6">
                  <button className="btn btn-primary">Explore experiences</button>
                </motion.div>
              </div>
            </motion.div>
          ) : null,
        )}
      </AnimatePresence>
      <div className="absolute right-6 bottom-6 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`w-10 h-10 rounded-md border-2 border-white/20 bg-white/10 text-white/90 ${
              i === index ? 'ring-2 ring-amber-300/50' : 'hover:bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
