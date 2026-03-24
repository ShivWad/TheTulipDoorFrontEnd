export default function RitualsPage() {
  return (
    <>
      <header className="mb-16">
        <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tighter leading-tight text-primary uppercase">
          My <span className="bg-secondary-container px-4">Rituals</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Track your floral journey. Each drop is a chapter in your space's story.
        </p>
      </header>

      {/* Active Subscription */}
      <section className="mb-16">
        <div className="bg-primary p-8 text-on-primary">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="font-headline font-black text-3xl tracking-tighter uppercase">Weekly Arrival</p>
              <p className="font-body text-sm opacity-80 mt-2">Every Thursday morning</p>
            </div>
            <span className="bg-secondary-container text-on-secondary-container px-4 py-2 font-headline font-bold text-sm uppercase tracking-widest">Active</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="font-headline font-bold text-xs uppercase tracking-widest opacity-60">Next Drop</p>
              <p className="font-body text-lg mt-1">March 27, 2026</p>
            </div>
            <div>
              <p className="font-headline font-bold text-xs uppercase tracking-widest opacity-60">Flowers</p>
              <p className="font-body text-lg mt-1">Tulips + Ranunculus</p>
            </div>
            <div>
              <p className="font-headline font-bold text-xs uppercase tracking-widest opacity-60">Delivery Slot</p>
              <p className="font-body text-lg mt-1">9:00 AM - 12:00 PM</p>
            </div>
            <div>
              <p className="font-headline font-bold text-xs uppercase tracking-widest opacity-60">Status</p>
              <p className="font-body text-lg mt-1">Preparing</p>
            </div>
          </div>
          <button className="w-full bg-secondary-container py-4 font-headline font-black text-on-secondary-container uppercase tracking-widest text-sm">
            Manage Subscription
          </button>
        </div>
      </section>

      {/* Past Drops */}
      <section>
        <h2 className="font-headline font-black text-2xl uppercase tracking-widest mb-8">Past Drops</h2>
        <div className="space-y-4">
          {[
            { date: "March 20, 2026", flowers: "Anemones + Forsythia", status: "Delivered" },
            { date: "March 13, 2026", flowers: "Daffodils + Hellebores", status: "Delivered" },
            { date: "March 6, 2026", flowers: "Hyacinths + Muscari", status: "Delivered" },
          ].map((drop, i) => (
            <div key={i} className="flex items-center justify-between bg-surface-container-lowest p-6 border-l-4 border-secondary-container">
              <div>
                <p className="font-headline font-bold text-lg uppercase">{drop.flowers}</p>
                <p className="font-body text-sm text-zinc-500 mt-1">{drop.date}</p>
              </div>
              <span className="text-secondary-container font-headline font-bold text-sm uppercase tracking-widest">{drop.status}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
