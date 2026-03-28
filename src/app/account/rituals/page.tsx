"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Plan {
  id: string;
  planKey: string;
  name: string;
  description: string | null;
  price: number;
  stems: string;
  type: string;
}

interface SubscriptionData {
  hasSubscription: boolean;
  subscription?: {
    id: string;
    plan: string;
    type?: string;
    planName: string;
    price: number;
    status: string;
    nextBillingDate: string | null;
    nextDeliveryDate: string | null;
    createdAt: string;
  };
}

export default function RitualsPage() {
  const { data: session } = useSession();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (session) {
      fetchSubscription();
      fetchPlans();
    }
  }, [session]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      setSubscriptionData(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planKey: string) => {
    setProcessing(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.shortUrl) {
          window.location.href = data.shortUrl;
        } else {
          setMessage({ type: "success", text: "Subscription created successfully!" });
          fetchSubscription();
          setShowPlanSelector(false);
        }
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create subscription" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setProcessing(false);
    }
  };

  const handleManage = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action} your subscription?`)) return;

    setProcessing(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        fetchSubscription();
        setShowManageMenu(false);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update subscription" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const recurringPlans = plans.filter(p => p.type !== "one_time");
  const oneTimePlans = plans.filter(p => p.type === "one_time");

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
          My <span className="bg-secondary-container px-4">Rituals</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Track your floral journey. Each drop is a chapter in your space&apos;s story.
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

      {/* Active Subscription */}
      <section className="mb-16">
        {subscriptionData?.hasSubscription && subscriptionData.subscription ? (
          <div className={`p-8 text-on-primary ${
            subscriptionData.subscription.status === "active" ? "bg-primary" :
            subscriptionData.subscription.status === "paused" ? "bg-zinc-500" : "bg-zinc-700"
          }`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="font-headline font-black text-3xl tracking-tighter uppercase">
                  {subscriptionData.subscription.planName}
                </p>
                <p className="font-body text-sm opacity-80 mt-2">
                  {subscriptionData.subscription.type === "one_time" 
                    ? formatPrice(subscriptionData.subscription.price)
                    : `${formatPrice(subscriptionData.subscription.price)} / month`}
                </p>
              </div>
              <span className="bg-secondary-container text-on-secondary-container px-4 py-2 font-headline font-bold text-sm uppercase tracking-widest">
                {subscriptionData.subscription.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <p className="font-headline font-bold text-xs uppercase tracking-widest opacity-60">Next Delivery</p>
                <p className="font-body text-lg mt-1">
                  {subscriptionData.subscription.nextDeliveryDate 
                    ? formatDate(subscriptionData.subscription.nextDeliveryDate)
                    : "N/A"}
                </p>
              </div>
              {subscriptionData.subscription.type !== "one_time" && (
                <>
                  <div>
                    <p className="font-headline font-bold text-xs uppercase tracking-widest opacity-60">Next Billing</p>
                    <p className="font-body text-lg mt-1">
                      {subscriptionData.subscription.nextBillingDate 
                        ? formatDate(subscriptionData.subscription.nextBillingDate)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-headline font-bold text-xs uppercase tracking-widest opacity-60">Delivery Slot</p>
                    <p className="font-body text-lg mt-1">Saturday Morning</p>
                  </div>
                </>
              )}
              <div>
                <p className="font-headline font-bold text-xs uppercase tracking-widest opacity-60">Status</p>
                <p className="font-body text-lg mt-1 capitalize">{subscriptionData.subscription.status}</p>
              </div>
            </div>

            {subscriptionData.subscription.status !== "cancelled" && subscriptionData.subscription.status !== "completed" && subscriptionData.subscription.type !== "one_time" && (
              <div className="relative">
                <button 
                  onClick={() => setShowManageMenu(!showManageMenu)}
                  disabled={processing}
                  className="w-full bg-secondary-container py-4 font-headline font-black text-on-secondary-container uppercase tracking-widest text-sm disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Manage Subscription"}
                </button>

                {showManageMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-container-lowest rounded shadow-lg overflow-hidden">
                    {subscriptionData.subscription.status === "active" && (
                      <>
                        <button 
                          onClick={() => handleManage("pause")}
                          disabled={processing}
                          className="w-full p-4 text-left font-headline font-bold uppercase text-primary hover:bg-surface-container transition-colors"
                        >
                          Pause Subscription
                        </button>
                        <button 
                          onClick={() => handleManage("cancel")}
                          disabled={processing}
                          className="w-full p-4 text-left font-headline font-bold uppercase text-error hover:bg-surface-container transition-colors"
                        >
                          Cancel Subscription
                        </button>
                      </>
                    )}
                    {subscriptionData.subscription.status === "paused" && (
                      <button 
                        onClick={() => handleManage("resume")}
                        disabled={processing}
                        className="w-full p-4 text-left font-headline font-bold uppercase text-primary hover:bg-surface-container transition-colors"
                      >
                        Resume Subscription
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container p-8 text-center">
            <p className="font-body text-xl text-zinc-500 mb-6">
              You don&apos;t have an active subscription yet.
            </p>
            <button 
              onClick={() => setShowPlanSelector(true)}
              className="bg-secondary-container text-on-secondary-container px-8 py-4 font-headline font-black uppercase tracking-widest"
            >
              Subscribe Now
            </button>
          </div>
        )}
      </section>

      {/* Plan Selector Modal */}
      {showPlanSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-headline font-black text-3xl uppercase">Choose Your Plan</h2>
              <button 
                onClick={() => setShowPlanSelector(false)}
                className="material-symbols-outlined text-zinc-400 hover:text-primary"
              >
                close
              </button>
            </div>

            {message.text && (
              <div className={`p-4 mb-6 font-medium text-sm ${
                message.type === "success" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-error-container text-on-error-container"
              }`}>
                {message.text}
              </div>
            )}

            {/* Recurring Plans */}
            {recurringPlans.length > 0 && (
              <>
                <h3 className="font-headline font-bold text-xl uppercase mb-4">Monthly Subscription</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {recurringPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handleSubscribe(plan.planKey)}
                      disabled={processing}
                      className="border-2 border-primary p-6 hover:bg-secondary-container transition-colors cursor-pointer flex flex-col justify-between aspect-[3/4] disabled:opacity-50"
                    >
                      <div>
                        <h3 className="text-2xl font-bold uppercase">{plan.name}</h3>
                        <p className="text-sm mt-2 font-medium opacity-70 uppercase tracking-tight">{plan.stems}</p>
                        <p className="text-xs mt-2 opacity-60">{plan.description}</p>
                      </div>
                      <span className="text-3xl font-black mt-4">
                        ₹{plan.price / 100}
                        <span className="text-sm font-normal">/mo</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* One-time Plans */}
            {oneTimePlans.length > 0 && (
              <>
                <h3 className="font-headline font-bold text-xl uppercase mb-4">One-Time Purchase</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {oneTimePlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handleSubscribe(plan.planKey)}
                      disabled={processing}
                      className="border-2 border-primary p-6 hover:bg-secondary-container transition-colors cursor-pointer flex flex-col justify-between aspect-[3/4] disabled:opacity-50"
                    >
                      <div>
                        <h3 className="text-2xl font-bold uppercase">{plan.name}</h3>
                        <p className="text-sm mt-2 font-medium opacity-70 uppercase tracking-tight">{plan.stems}</p>
                        <p className="text-xs mt-2 opacity-60">{plan.description}</p>
                      </div>
                      <span className="text-3xl font-black mt-4">
                        ₹{plan.price / 100}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-center text-sm text-zinc-500 mt-6">
              Payment processed securely via Razorpay. Cancel anytime.
            </p>
          </div>
        </div>
      )}

      {/* Past Drops */}
      <section>
        <h2 className="font-headline font-black text-2xl uppercase tracking-widest mb-8">Past Drops</h2>
        {subscriptionData?.hasSubscription ? (
          <div className="bg-surface-container-lowest p-8 border-l-4 border-secondary-container">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-headline font-bold text-lg uppercase">Your subscription started</p>
                <p className="font-body text-sm text-zinc-500 mt-1">
                  {subscriptionData.subscription?.createdAt 
                    ? new Date(subscriptionData.subscription.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
              <span className="text-secondary-container font-headline font-bold text-sm uppercase tracking-widest">
                Active
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container p-12 text-center">
            <div className="w-20 h-20 bg-primary-container mx-auto mb-6 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary">local_florist</span>
            </div>
            <h3 className="font-headline font-black text-2xl uppercase mb-4">Drops Coming Soon</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              Your first floral delivery will appear here once your subscription begins. 
              Get ready for weekly bursts of creativity delivered to your door.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
