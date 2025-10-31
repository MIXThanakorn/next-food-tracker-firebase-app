"use client";

import Image from "next/image";
import Link from "next/link";

import { useEffect, useState } from "react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This is a common practice in Next.js to ensure the component is mounted
    // before rendering, to prevent hydration errors.
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return null or a loading state to prevent rendering on the server
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-white">
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-8">
          <Image
            src="/food_tracker.png"
            alt="Food Tracker Logo"
            width={300}
            height={300}
            className="rounded-xl shadow-lg"
          />
        </div>

        {/* Main heading */}
        <h1 className="mb-2 text-5xl font-bold text-blue-400 md:text-6xl">
          Welcome to Food Tracker
        </h1>

        {/* Sub-heading */}
        <p className="mb-10 text-xl text-gray-400 md:text-2xl">
          Track your meal!!
        </p>

        {/* Link buttons for Login and Register pages */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Link href="/login">
            <button className="w-full rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 md:px-10 md:py-4">
              Login
            </button>
          </Link>
          <Link href="/register">
            <button className="w-full rounded-full bg-slate-700 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500 md:px-10 md:py-4">
              Register
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
