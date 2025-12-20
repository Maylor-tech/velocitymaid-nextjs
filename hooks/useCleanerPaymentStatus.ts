"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
// Note: You'll need to add these to your .env.local:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Hook to fetch cleaner's payment method verification status
 * 
 * @returns { hasVerifiedPayment: boolean, isLoading: boolean }
 */
export function useCleanerPaymentStatus() {
  const [hasVerifiedPayment, setHasVerifiedPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPaymentStatus() {
      try {
        setIsLoading(true);

        // Get cleaner ID from cookie (same method used in dashboard)
        const cleanerId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("cleanerId="))
          ?.split("=")[1];

        if (!cleanerId) {
          setHasVerifiedPayment(false);
          setIsLoading(false);
          return;
        }

        // Query Supabase for verified payment method
        // SELECT * FROM CleanerPaymentMethod WHERE cleanerId = [current] AND verifiedAt IS NOT NULL AND isActive = true
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("CleanerPaymentMethod")
          .select("id")
          .eq("cleanerId", cleanerId)
          .not("verifiedAt", "is", null) // verifiedAt IS NOT NULL
          .eq("isActive", true)
          .limit(1);

        if (error) {
          console.error("Error checking payment status:", error);
          setHasVerifiedPayment(false);
        } else {
          // If ANY row exists with verified=true → hasVerifiedPayment = true
          setHasVerifiedPayment(data && data.length > 0);
        }
      } catch (err) {
        console.error("Error in useCleanerPaymentStatus:", err);
        setHasVerifiedPayment(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkPaymentStatus();
  }, []);

  return { hasVerifiedPayment, isLoading };
}

