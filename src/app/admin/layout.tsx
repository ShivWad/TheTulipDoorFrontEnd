"use client";

/**
 * Admin Layout Component
 * 
 * Provides the shared layout for all admin pages including:
 * - Top navigation bar with admin section links
 * - Mobile-friendly bottom navigation
 * - Sign out functionality
 * - Responsive design (top nav on desktop, bottom nav on mobile)
 * 
 * All admin pages are rendered as children within this layout.
 * 
 * Security: Client-side redirect to login if no session exists.
 * Server-side API routes enforce admin permissions separately.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check admin authorization on mount
  useEffect(() => {
    // Still loading session
    if (status === "loading") return;

    // No session - redirect to login
    if (!session) {
      router.push("/login");
      return;
    }

    // Check if user is admin (only client-side check, real enforcement is in API)
    if (session.user && !(session.user as any).isAdmin) {
      router.push("/");
    }
  }, [session, status, router]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">
          sync
        </span>
      </div>
    );
  }

  // Don't render if not authorized
  if (!session || !(session.user as any).isAdmin) {
    return null;
  }

  /**
   * Navigation items for the admin panel
   * Each item maps to a page under /admin/
   * href: The route path
   * label: Display name
   * icon: Material symbols icon name
   */
  const navItems = [
    { href: "/admin/users", label: "Users", icon: "people" },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: "subscriptions" },
    { href: "/admin/orders", label: "Orders", icon: "shopping_bag" },
    { href: "/admin/payments", label: "Payments", icon: "payments" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
  ];

  /**
   * Check if a nav link is active
   * Uses startsWith to match parent routes (e.g., /admin/users matches /admin/users/[id])
   */
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Top Nav - Desktop only (hidden on mobile) */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo and main navigation links */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              Admin Panel
            </Link>
            {/* Horizontal nav - visible on medium+ screens */}
            <div className="hidden md:flex gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
              View Site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation - visible only on small screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                isActive(item.href) ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {/* Padding accounts for fixed top nav (desktop) or bottom nav (mobile) */}
      <main className="pt-24 pb-20 md:pt-24 px-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}