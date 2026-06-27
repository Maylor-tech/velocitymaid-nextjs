import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Join the Team | VelocityMaid",
  description:
    "Join the VelocityMaid team. Flexible schedules, competitive pay, and a supportive team environment.",
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-vm-surface">
      <SiteHeader bookingHref="/book?branch=new-jersey" />

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-vm-navy text-4xl mb-4">
              Join the VelocityMaid Team
            </h1>
            <p className="font-body text-vm-muted text-xl">
              Flexible schedules, competitive pay, and a supportive team environment
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 card-hover">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-vm-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-vm-cyan-dark" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-vm-text mb-2">
                  Become a Cleaner
                </h2>
                <p className="font-body text-vm-muted">Start earning with flexible hours</p>
              </div>
              <Link
                href="/cleaners/apply"
                className="block w-full bg-vm-navy text-white text-center py-3 px-6 rounded-full font-semibold hover:bg-vm-navy transition"
                aria-label="Apply to become a cleaner"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-vm-muted">
          <p>
            &copy; {new Date().getFullYear()} VelocityMaid.{" "}
            <Link href="/" className="hover:text-white transition">
              Back to home
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
