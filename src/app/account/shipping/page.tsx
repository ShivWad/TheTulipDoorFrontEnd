"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Address {
  id: string;
  type: string;
  fullName: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string | null;
  isDefault: boolean;
}

const EXAMPLE_ADDRESS: Omit<Address, "id"> = {
  type: "home",
  fullName: "John Doe",
  address: "123 Example Street",
  city: "Gurugram",
  state: "Haryana",
  pincode: "122001",
  phone: "+91 98XXX XXXXX",
  isDefault: true,
};

export default function ShippingPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "home",
    fullName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    isDefault: false,
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (session) {
      fetchAddresses();
    }
  }, [session]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const url = editingId ? `/api/addresses?id=${editingId}` : "/api/addresses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: "success", text: editingId ? "Address updated" : "Address added" });
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchAddresses();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save address" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`/api/addresses?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Address deleted" });
        fetchAddresses();
      } else {
        setMessage({ type: "error", text: "Failed to delete address" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      type: address.type,
      fullName: address.fullName || "",
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone || "",
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: "home",
      fullName: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      isDefault: false,
    });
  };

  const openNewForm = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="material-symbols-outlined text-primary animate-spin">sync</span>
      </div>
    );
  }

  return (
    <>
      <header className="mb-16">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-headline font-black tracking-tighter leading-tight text-primary uppercase">
          Shipping <span className="bg-secondary-container px-4">Addresses</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Your physical coordinates. Where the ritual arrives.
        </p>
      </header>

      {message.text && (
        <div className={`p-4 mb-8 font-medium text-sm ${
          message.type === "success" 
            ? "bg-green-100 text-green-800" 
            : "bg-error-container text-on-error-container"
        }`}>
          {message.text}
        </div>
      )}

      {/* Saved Addresses */}
      <section className="mb-16">
        {addresses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-lowest p-8 border-l-4 border-secondary-container opacity-60">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 font-headline font-bold text-xs uppercase tracking-widest">Example</span>
              </div>
              <p className="font-headline font-bold text-lg uppercase mb-2">{EXAMPLE_ADDRESS.type}</p>
              <p className="font-body text-zinc-600 leading-relaxed">
                {EXAMPLE_ADDRESS.fullName}<br />
                {EXAMPLE_ADDRESS.address}<br />
                {EXAMPLE_ADDRESS.city}, {EXAMPLE_ADDRESS.state} {EXAMPLE_ADDRESS.pincode}<br />
                {EXAMPLE_ADDRESS.phone}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {addresses.map((addr) => (
              <div 
                key={addr.id} 
                className={`bg-surface-container-lowest p-8 border-l-4 ${
                  addr.isDefault ? "border-secondary-container" : "border-outline-variant"
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  {addr.isDefault ? (
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 font-headline font-bold text-xs uppercase tracking-widest">Default</span>
                  ) : (
                    <span className="text-zinc-400 font-headline font-bold text-xs uppercase tracking-widest">{addr.type}</span>
                  )}
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => handleEdit(addr)}
                      className="material-symbols-outlined text-zinc-400 hover:text-primary"
                    >
                      edit
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(addr.id)}
                      className="material-symbols-outlined text-zinc-400 hover:text-error"
                    >
                      delete
                    </button>
                  </div>
                </div>
                <p className="font-headline font-bold text-lg uppercase mb-2">{addr.type}</p>
                <p className="font-body text-zinc-600 leading-relaxed">
                  {addr.fullName}<br />
                  {addr.address}<br />
                  {addr.city}, {addr.state} {addr.pincode}<br />
                  {addr.phone}
                </p>
              </div>
            ))}
          </div>
        )}

        <button 
          type="button" 
          onClick={openNewForm}
          className="mt-8 flex items-center gap-2 text-primary font-headline font-bold text-sm uppercase tracking-widest"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Address
        </button>
      </section>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-headline font-black text-2xl uppercase">
                {editingId ? "Edit Address" : "New Address"}
              </h2>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="material-symbols-outlined text-zinc-400 hover:text-primary"
              >
                close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="type" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Type</label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="fullName" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="address" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Street Address</label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="city" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">City</label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                    placeholder="Gurugram"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="state" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">State</label>
                  <input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                    placeholder="Haryana"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="pincode" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Pincode</label>
                  <input
                    id="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                    placeholder="122001"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                    placeholder="+91 98XXX XXXXX"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-5 h-5 accent-primary"
                />
                <span className="font-body text-lg">Set as default address</span>
              </label>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 py-4 font-headline font-bold uppercase tracking-widest border-2 border-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-secondary-container text-on-secondary-container py-4 font-headline font-black uppercase tracking-widest"
                >
                  {editingId ? "Update" : "Add"} Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Preferences */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4">
          <span className="font-headline font-bold text-3xl text-primary-dim block mb-2">01</span>
          <h3 className="font-headline font-black text-xl uppercase tracking-widest">Delivery Preferences</h3>
          <p className="text-sm text-zinc-500 mt-2">How we hand over the ritual.</p>
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 gap-6 bg-surface-container-lowest p-8 shadow-[12px_12px_0px_0px_#56588310]">
          <div className="flex flex-col gap-2">
            <label htmlFor="timeSlot" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Preferred Time Slot</label>
            <select id="timeSlot" className="bg-surface-container-high border-none py-4 px-6 font-body text-lg">
              <option>Morning (9:00 AM - 12:00 PM)</option>
              <option>Afternoon (12:00 PM - 3:00 PM)</option>
              <option>Evening (3:00 PM - 7:00 PM)</option>
            </select>
          </div>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-primary" defaultChecked />
              <span className="font-body text-lg">Leave at door / reception</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-primary" />
              <span className="font-body text-lg">Ring bell on arrival</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-primary" />
              <span className="font-body text-lg">SMS/Call on arrival</span>
            </label>
          </div>
        </div>
      </section>
    </>
  );
}
