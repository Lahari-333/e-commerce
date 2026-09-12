import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white py-16 sm:py-24">
      {/* Decorative Glow Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Next-Gen E-Commerce Storefront
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Curated Essentials for Modern Living.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Explore high-performance electronics, contemporary fashion, home essentials, and fitness gear—backed by seamless shopping, rapid delivery, and verifiable inventory.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#categories"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl backdrop-blur-sm transition-colors"
              >
                Explore Categories
              </a>
            </div>

            {/* Key Trust Pillars */}
            <div className="pt-8 border-t border-slate-800 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-slate-400 mt-0.5">Authentic Goods</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">Express</p>
                <p className="text-xs text-slate-400 mt-0.5">Free Delivery</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">24/7</p>
                <p className="text-xs text-slate-400 mt-0.5">Customer Care</p>
              </div>
            </div>
          </div>

          {/* Hero Feature Visual Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Featured Showcase
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                  In Stock
                </span>
              </div>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center relative">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                  alt="Featured Headphones"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Wireless ANC Studio Headphones
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  40-hour battery life with hybrid active noise cancellation and crystal-clear frequency response.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <div>
                  <span className="text-xs text-slate-400">Special Price</span>
                  <p className="text-xl font-extrabold text-white">₹2,499.00</p>
                </div>
                <Link
                  to="/products/wireless-anc-headphones"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
