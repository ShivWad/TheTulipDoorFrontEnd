export default function DigitalVaultPage() {
  return (
    <>
      <header className="mb-16">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-headline font-black tracking-tighter leading-tight text-primary uppercase">
          The <span className="bg-secondary-container px-4">Digital Vault</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Your collection of memories, playlists, and rituals preserved in time.
        </p>
      </header>

      {/* Saved Playlists */}
      <section className="mb-16">
        <h2 className="font-headline font-black text-xl uppercase tracking-widest mb-8">Sound Environments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "Vol. 14: Morning Dew", date: "March 2026", flowers: "Tulips + Ranunculus" },
            { name: "Vol. 13: Spring Awakening", date: "March 2026", flowers: "Anemones + Forsythia" },
            { name: "Vol. 12: Early Light", date: "March 2026", flowers: "Daffodils + Hellebores" },
            { name: "Vol. 11: Fresh Start", date: "February 2026", flowers: "Hyacinths + Muscari" },
          ].map((playlist, i) => (
            <div key={i} className="bg-surface-container-lowest p-6 border-l-4 border-primary hover:border-secondary-container transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">play_arrow</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-lg uppercase">{playlist.name}</p>
                  <p className="font-body text-sm text-zinc-500">{playlist.date}</p>
                </div>
              </div>
              <p className="font-body text-sm text-zinc-600">{playlist.flowers}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="mb-16">
        <h2 className="font-headline font-black text-xl uppercase tracking-widest mb-8">Your Arrangements</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-surface-container-high flex items-center justify-center group cursor-pointer hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-zinc-400 group-hover:text-primary">add_photo_alternate</span>
            </div>
          ))}
        </div>
      </section>

      {/* Downloadable Guides */}
      <section>
        <h2 className="font-headline font-black text-xl uppercase tracking-widest mb-8">Care Guides</h2>
        <div className="space-y-4">
          {[
            { title: "Tulip Care Manual", type: "PDF" },
            { title: "Seasonal Flower Guide", type: "PDF" },
            { title: "Arrangement Techniques", type: "PDF" },
          ].map((doc, i) => (
            <div key={i} className="flex items-center justify-between bg-surface-container-lowest p-6 hover:bg-surface-container transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">description</span>
                <span className="font-body font-medium">{doc.title}</span>
              </div>
              <span className="text-zinc-500 text-sm">{doc.type}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
