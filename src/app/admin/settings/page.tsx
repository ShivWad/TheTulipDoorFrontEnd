import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500 mt-1">Manage system-wide settings</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form className="space-y-6 p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Solo Plan Price (₹/month)</label>
                <input
                  type="number"
                  defaultValue="1800"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Studio Plan Price (₹/month)</label>
                <input
                  type="number"
                  defaultValue="3400"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Plan Price (₹/month)</label>
                <input
                  type="number"
                  defaultValue="4800"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Days</label>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                    Monday
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                    Wednesday
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                    Friday
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time Slot</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="morning">Morning (9 AM - 12 PM)</option>
                  <option value="afternoon" selected>Afternoon (12 PM - 5 PM)</option>
                  <option value="evening">Evening (5 PM - 8 PM)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Settings</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="order-notifications" type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="order-notifications" className="font-medium text-gray-900">
                    Order status notifications
                  </label>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="delivery-notifications" type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="delivery-notifications" className="font-medium text-gray-900">
                    Delivery notifications
                  </label>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="newsletter-notifications" type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="newsletter-notifications" className="font-medium text-gray-900">
                    Newsletter subscriptions
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  defaultValue="The Tulip Door"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Support Email</label>
                <input
                  type="email"
                  defaultValue="support@thetulipdoor.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="bg-gray-50 px-6 py-4">
          <div className="flex justify-end">
            <button
              className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}