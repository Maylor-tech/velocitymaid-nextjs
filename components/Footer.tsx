/**
 * Footer Component
 * 
 * Clean, minimal footer for institutional pages
 * Aligned with VelocityMaid brand voice
 */

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">VelocityMaid</h3>
            <p className="mt-2 text-sm text-gray-600">
              Infrastructure for trust at scale.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Resources</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-600">
              <li>
                <a href="/partners" className="hover:text-gray-900">
                  Partners
                </a>
              </li>
              <li>
                <a href="/investors/materials" className="hover:text-gray-900">
                  Investor Materials
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-gray-900">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-600">
              <li>
                <a href="mailto:hello@velocitymaid.com" className="hover:text-gray-900">
                  hello@velocitymaid.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} VelocityMaid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


