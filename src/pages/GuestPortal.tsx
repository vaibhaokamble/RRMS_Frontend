import { useState } from 'react';
import {
  BedDouble,
  Coffee,
  Sparkles,
  ClipboardList,
  Plus,
  Minus,
  ShoppingCart,
  CalendarDays,
  Clock,
  ArrowRight,
  Info,
  Droplets,
  Wind,
  Wifi,
  Phone,
  Check,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { today, dateOffset, money, folio, live } from '../lib/domain';
import { PageMotion, PageTitle, Card, CardHead, Button, Badge, Modal, FormModal, DataTable, Empty } from '../components/ui';

/* -------------------------------------------------------------------------------------------------
 * GUEST ROOM
 * -----------------------------------------------------------------------------------------------*/
export function GuestRoom() {
  const { s, actor, act } = useStore();
  const g = s.guests.find((x) => x.id === actor!.guestId);
  const r = s.reservations.find((x) => x.guestId === g?.id && x.status === 'Checked in') ??
            s.reservations.find((x) => x.guestId === g?.id && x.status === 'Confirmed');
  const room = s.rooms.find((x) => x.id === r?.roomId);

  const requestService = (name: string, category: string = 'Housekeeping') => {
    if (!r) return;
    act({
      type: 'service.create',
      payload: {
        reservationId: r.id,
        name: name,
        category: category,
        amount: 0,
        date: today(),
        time: `${new Date().getHours() + 1}:00`,
        options: 'Requested from My Room dashboard',
      }
    }, `${name} request sent to our team!`);
  };

  if (!room) {
    return (
      <PageMotion>
        <PageTitle eyebrow="MY ROOM" title="Your Sanctuary Awaits" description="Your room details will appear here once assigned." />
        <Empty title="No room assigned yet" description="Your room will be assigned shortly before check-in." />
      </PageMotion>
    );
  }

  const roomImages: Record<string, string> = {
    'Garden Deluxe': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    'Ocean Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'Pool Villa': 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80'
  };

  return (
    <PageMotion>
      <PageTitle eyebrow="MY ROOM" title={`Room ${room.number}`} description={room.type} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden">
            <div className="h-64 sm:h-80 w-full relative">
              <img src={roomImages[room.type] || roomImages['Ocean Suite']} alt={room.type} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1F3A2E] rounded-full">
                {room.floor}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-serif text-2xl text-[#22261F] mb-4">About your room</h3>
              <p className="text-[#6B7160] leading-relaxed mb-6">
                Designed for ultimate comfort and relaxation, your {room.type.toLowerCase()} features premium amenities, stunning views, and everything you need for a perfect stay.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#F0EBE1]">
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#1F3A2E] flex items-center justify-center"><BedDouble size={16} /></div>
                  <span className="text-xs font-semibold text-[#22261F]">King Bed</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#1F3A2E] flex items-center justify-center"><Wind size={16} /></div>
                  <span className="text-xs font-semibold text-[#22261F]">Climate Control</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#1F3A2E] flex items-center justify-center"><Droplets size={16} /></div>
                  <span className="text-xs font-semibold text-[#22261F]">Rain Shower</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#1F3A2E] flex items-center justify-center"><Wifi size={16} /></div>
                  <span className="text-xs font-semibold text-[#22261F]">Free Wi-Fi</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-[#1F3A2E] text-white">
            <h3 className="font-serif text-xl mb-4 text-[#C9A227]">Quick Requests</h3>
            <p className="text-sm text-white/80 mb-6">Need something for your room? Just tap below.</p>
            <div className="space-y-3">
              <Button className="w-full bg-white/10 hover:bg-white/20 text-left justify-start border-none" onClick={() => requestService('Extra Towels', 'Housekeeping')}>
                <Plus size={16} className="mr-2 text-[#C9A227]" /> Extra Towels
              </Button>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-left justify-start border-none" onClick={() => requestService('Bottled Water', 'Housekeeping')}>
                <Plus size={16} className="mr-2 text-[#C9A227]" /> Bottled Water
              </Button>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-left justify-start border-none" onClick={() => requestService('Room Cleaning', 'Housekeeping')}>
                <Sparkles size={16} className="mr-2 text-[#C9A227]" /> Make up room
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-serif text-lg text-[#22261F] mb-4 flex items-center gap-2">
              <Phone size={18} className="text-[#C9A227]" /> Front Desk
            </h3>
            <p className="text-sm text-[#6B7160] mb-4">
              Dial <strong>0</strong> from your room phone for immediate assistance, available 24/7.
            </p>
            <div className="text-sm font-mono bg-[#FAF7F2] p-3 rounded-lg border border-[#F0EBE1]">
              Wi-Fi: ThePalm_Guest<br/>
              Password: {r?.id.split('-')[1]}
            </div>
          </Card>
        </div>
      </div>
    </PageMotion>
  );
}

/* -------------------------------------------------------------------------------------------------
 * GUEST DINING (F&B)
 * -----------------------------------------------------------------------------------------------*/
export function GuestDining() {
  const { s, actor, act } = useStore();
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [instructions, setInstructions] = useState('');
  
  const g = s.guests.find((x) => x.id === actor!.guestId);
  const r = s.reservations.find((x) => x.guestId === g?.id && live(x));

  const menu = [
    { id: 'm1', category: 'Breakfast', name: 'Continental Breakfast', desc: 'Fresh pastries, fruit, juice, and coffee', price: 850 },
    { id: 'm2', category: 'Breakfast', name: 'Avocado Toast', desc: 'Poached eggs, sourdough, chili flakes', price: 650 },
    { id: 'm3', category: 'Mains', name: 'Grilled Sea Bass', desc: 'Lemon butter sauce, asparagus, mash', price: 1800 },
    { id: 'm4', category: 'Mains', name: 'Club Sandwich', desc: 'Grilled chicken, bacon, egg, fries', price: 950 },
    { id: 'm5', category: 'Beverages', name: 'Fresh Watermelon Juice', desc: 'Chilled pressed watermelon', price: 300 },
    { id: 'm6', category: 'Beverages', name: 'Artisan Latte', desc: 'Arabica beans, oat milk option', price: 250 },
  ];

  const addToCart = (item: any) => {
    setCart(curr => {
      const ex = curr.find(x => x.id === item.id);
      if (ex) return curr.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...curr, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(curr => curr.map(x => x.id === id ? { ...x, quantity: Math.max(0, x.quantity + delta) } : x).filter(x => x.quantity > 0));
  };

  const total = cart.reduce((n, x) => n + x.price * x.quantity, 0);

  const placeOrder = () => {
    if (!r) return;
    if (cart.length === 0) return;
    
    // Create one consolidated service request for the order
    const orderDetails = cart.map(x => `${x.quantity}x ${x.name}`).join(', ');
    const opts = instructions ? `${orderDetails} | Notes: ${instructions}` : orderDetails;
    
    act({
      type: 'service.create',
      payload: {
        reservationId: r.id,
        name: 'In-room dining',
        category: 'Food & Beverage',
        amount: total,
        date: today(),
        time: `${new Date().getHours() + 1}:00`,
        options: opts,
      }
    }, 'Your order has been placed! Our kitchen is preparing it now.');
    
    setCart([]);
    setInstructions('');
  };

  if (!r) {
    return (
      <PageMotion>
        <PageTitle eyebrow="IN-ROOM DINING" title="Food & Beverage" description="In-room dining" />
        <Empty title="No active stay" description="Dining orders are available during your stay." />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageTitle eyebrow="CRAVING SOMETHING SPECIAL?" title="In-Room Dining" description="Fresh flavors delivered directly to your door." />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {['Breakfast', 'Mains', 'Beverages'].map(cat => (
            <div key={cat}>
              <h3 className="font-serif text-xl text-[#22261F] mb-4">{cat}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menu.filter(m => m.category === cat).map(item => (
                  <div key={item.id} onClick={() => addToCart(item)} className="cursor-pointer">
                    <Card className="p-4 flex flex-col justify-between hover:border-[#C9A227] transition-colors group h-full">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-[#22261F] group-hover:text-[#C9A227] transition-colors">{item.name}</h4>
                          <span className="text-[#1F3A2E] font-medium">{money(item.price)}</span>
                        </div>
                        <p className="text-xs text-[#6B7160]">{item.desc}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#F0EBE1] flex justify-end">
                        <Button size="sm" variant="outline" className="text-xs"><Plus size={14} className="mr-1" /> Add</Button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <Card className="p-6 sticky top-6">
            <h3 className="font-serif text-xl text-[#22261F] mb-4 flex items-center gap-2">
              <ShoppingCart size={18} /> Your Order
            </h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-[#6B7160]">
                <Coffee size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Your cart is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <strong className="block text-[#22261F]">{item.name}</strong>
                      <span className="text-[#6B7160]">{money(item.price)} each</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#FAF7F2] rounded-lg p-1 border border-[#F0EBE1]">
                      <button className="p-1 hover:text-[#C1443A]" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                      <span className="w-4 text-center font-bold">{item.quantity}</span>
                      <button className="p-1 hover:text-[#2E7D4F]" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-[#F0EBE1]">
                  <textarea 
                    className="w-full text-sm border border-[#F0EBE1] rounded-lg p-2 focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] outline-none transition-all resize-none"
                    placeholder="Special instructions or dietary requirements..."
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
                
                <div className="pt-4 border-t border-[#F0EBE1] flex justify-between items-center mb-6">
                  <span className="text-[#6B7160] font-semibold">Total</span>
                  <span className="text-xl font-serif text-[#1F3A2E]">{money(total)}</span>
                </div>
                
                <Button className="w-full" onClick={placeOrder}>Place Order — {money(total)}</Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageMotion>
  );
}

/* -------------------------------------------------------------------------------------------------
 * GUEST SPA
 * -----------------------------------------------------------------------------------------------*/
export function GuestSpa() {
  const { s, actor, act } = useStore();
  const [booking, setBooking] = useState<{ id: string; name: string; price: number; duration: string } | null>(null);
  
  const g = s.guests.find((x) => x.id === actor!.guestId);
  const r = s.reservations.find((x) => x.guestId === g?.id && live(x));

  const spaMenu = [
    { id: 's1', name: 'Balinese Massage', desc: 'Traditional deep tissue massage using warm oils', duration: '60 mins', price: 2800 },
    { id: 's2', name: 'Aromatherapy Bliss', desc: 'Gentle relaxation massage with custom essential oils', duration: '90 mins', price: 3500 },
    { id: 's3', name: 'Revitalizing Facial', desc: 'Deep cleansing, exfoliation, and hydration', duration: '45 mins', price: 2200 },
    { id: 's4', name: 'Couples Retreat', desc: 'Side-by-side massage in our premium ocean-view suite', duration: '90 mins', price: 6500 },
  ];

  if (!r) {
    return (
      <PageMotion>
        <PageTitle eyebrow="WELLNESS & SPA" title="Ananda Spa" description="Spa & Wellness" />
        <Empty title="No active stay" description="Spa bookings are available during your stay." />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageTitle eyebrow="RESTORE BALANCE & HARMONY" title="Ananda Spa & Wellness" description="Discover our curated menu of rejuvenating treatments." />
      
      <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden mb-12 shadow-sm">
        <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80" alt="Spa" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F3A2E]/80 to-transparent flex items-end p-8">
          <div>
            <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 mb-3 hover:bg-white/30">AWARD WINNING</Badge>
            <h2 className="text-3xl font-serif text-white mb-2">Sanctuary of Senses</h2>
            <p className="text-white/80 max-w-xl">Immerse yourself in a world of tranquility. Our expert therapists blend ancient healing traditions with modern wellness practices.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spaMenu.map(item => (
          <Card key={item.id} className="p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-serif text-xl text-[#22261F]">{item.name}</h3>
                <span className="inline-flex items-center text-xs text-[#6B7160] mt-1"><Clock size={12} className="mr-1" /> {item.duration}</span>
              </div>
              <span className="text-[#1F3A2E] font-bold">{money(item.price)}</span>
            </div>
            <p className="text-[#6B7160] text-sm mb-6">{item.desc}</p>
            <Button variant="outline" className="w-full" onClick={() => setBooking(item)}>Book Appointment</Button>
          </Card>
        ))}
      </div>

      {booking && (
        <FormModal
          title={`Book ${booking.name}`}
          fields={[
            { name: 'date', label: 'Preferred Date', type: 'date', required: true },
            { name: 'time', label: 'Preferred Time', type: 'time', required: true },
            { name: 'notes', label: 'Health conditions / Preferences', type: 'textarea' }
          ]}
          onClose={() => setBooking(null)}
          onSubmit={(values) => {
            return act({
              type: 'service.create',
              payload: {
                reservationId: r.id,
                name: booking.name,
                category: 'Spa',
                amount: booking.price,
                date: values.date,
                time: values.time,
                options: values.notes,
              }
            }, 'Spa appointment requested! We will confirm shortly.');
          }}
          submit="Request Appointment"
        />
      )}
    </PageMotion>
  );
}

/* -------------------------------------------------------------------------------------------------
 * GUEST REQUESTS TRACKING
 * -----------------------------------------------------------------------------------------------*/
export function GuestRequests() {
  const { s, actor } = useStore();
  
  const g = s.guests.find((x) => x.id === actor!.guestId);
  const myReservations = s.reservations.filter(x => x.guestId === g?.id).map(r => r.id);
  
  const myServices = s.services.filter(x => myReservations.includes(x.reservationId));
  const myComplaints = s.complaints.filter(x => x.guestId === g?.id);

  // Combine services and complaints into a unified view for the guest
  const allRequests = [
    ...myServices.map(srv => ({
      id: srv.id,
      title: srv.name,
      type: srv.category,
      date: srv.date,
      status: srv.status,
      description: srv.options || 'Service request',
      isComplaint: false
    })),
    ...myComplaints.map(cmp => ({
      id: cmp.id,
      title: cmp.subject,
      type: 'Support / ' + cmp.category,
      date: cmp.date?.slice(0,10) || today(),
      status: cmp.status,
      description: cmp.description,
      isComplaint: true
    }))
  ].sort((a, b) => (b.date > a.date ? 1 : -1));

  const formatStatus = (status: string, isComplaint: boolean) => {
    const s = status.toUpperCase();
    if (isComplaint) {
      if (s === 'OPEN') return 'PENDING';
      if (s === 'ASSIGNED') return 'ACCEPTED';
      if (s === 'RESOLVED' || s === 'CLOSED') return 'COMPLETED';
    }
    return s.replace('IN PROGRESS', 'IN_PROGRESS');
  };

  return (
    <PageMotion>
      <PageTitle eyebrow="STAY INFORMED" title="My Requests" description="Track the status of your orders, services, and support tickets." />
      
      <Card>
        <CardHead title="All Requests" subtitle="Live updates from our team" />
        <DataTable
          rows={allRequests}
          searchBy={(x) => `${x.title} ${x.type} ${x.status}`}
          columns={[
            {
              key: 'request',
              label: 'Request',
              render: (r) => (
                <div>
                  <strong className="block text-[#22261F]">{r.title}</strong>
                  <span className="text-xs text-[#6B7160] block mt-0.5">{r.type}</span>
                </div>
              )
            },
            {
              key: 'date',
              label: 'Date',
              render: (r) => <span className="text-[#6B7160] text-sm">{r.date}</span>
            },
            {
              key: 'status',
              label: 'Status',
              render: (r) => {
                const stat = formatStatus(r.status, r.isComplaint);
                let badgeClass = '';
                if (stat === 'COMPLETED' || stat === 'DELIVERED') badgeClass = 'bg-[#2E7D4F]/10 text-[#2E7D4F] border-[#2E7D4F]/20';
                else if (stat === 'CANCELLED') badgeClass = 'bg-[#C1443A]/10 text-[#C1443A] border-[#C1443A]/20';
                else if (stat === 'IN_PROGRESS' || stat === 'PREPARING' || stat === 'OUT_FOR_DELIVERY') badgeClass = 'bg-[#D98E04]/10 text-[#D98E04] border-[#D98E04]/20';
                else badgeClass = 'bg-[#C9A227]/10 text-[#C9A227] border-[#C9A227]/20';
                
                return <Badge className={badgeClass}>{stat}</Badge>;
              }
            }
          ]}
        />
      </Card>
    </PageMotion>
  );
}
