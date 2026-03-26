import { redirect } from "next/navigation";

/**
 * Admin Root Page
 * 
 * This is the entry point for the /admin route.
 * Since the admin panel has multiple sections, we redirect
 * users to the default section (Users) when they visit /admin.
 * 
 * @redirects to /admin/users
 */

export default function AdminRoot() {
  // Redirect to the default admin section (Users)
  redirect("/admin/users");
}