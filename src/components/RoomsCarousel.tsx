import { motion } from 'framer-motion';

export default function RoomsCarousel({ rooms = [] }: { rooms?: any[] }) {
  const sample = rooms.length
    ? rooms
    : [
        { id: 'r1', title: 'Garden Deluxe', image: '/images/suite.jpg', price: 240 },
        { id: 'r2', title: 'Ocean Suite', image: '/images/resort.jpg', price: 420 },
        { id: 'r3', title: 'Pool Villa', image: '/images/suite.jpg', price: 560 },
      ];
  return (
    <div className="rooms-carousel" style={{ overflow: 'hidden' }}>
      <div className="flex gap-6 overflow-x-auto py-4 px-1 scrollbar-hidden">
        {sample.map((r, i) => (
          <motion.div
            key={r.id}
            className="card room-card"
            style={{ minWidth: 320, borderRadius: 14, overflow: 'hidden' }}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div style={{ height: 180, overflow: 'hidden' }}>
              <img src={r.image} alt={r.title} className="w-full h-full object-cover" />
            </div>
            <div style={{ padding: 14 }}>
              <strong style={{ display: 'block', fontSize: 16 }}>{r.title}</strong>
              <p className="muted" style={{ marginTop: 6 }}>
                Elegant room · Sea view · King bed
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
                <div>
                  <div className="muted">From</div>
                  <div style={{ fontWeight: 600 }}>₹{r.price}</div>
                </div>
                <button className="btn btn-primary">Book now</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
