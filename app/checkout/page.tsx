"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("bKash");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // WhatsApp মেসেজ তৈরি করা
    const message = `New Order - One Shop%0A%0AFull Name: ${encodeURIComponent(fullName)}%0APhone (WhatsApp): ${encodeURIComponent(phone)}%0AEmail: ${encodeURIComponent(email)}%0APayment Method: ${paymentMethod}%0APayment Number: 01571282946`;
    
    // WhatsApp লিংক ওপেন করা
    window.open(`https://wa.me/8801571282946?text=${message}`, "_blank");
  };

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold text-yellow-400">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="mt-10 max-w-xl bg-zinc-900 border border-yellow-500 rounded-xl p-6">
        
        {/* Full Name Field (Mandatory) */}
        <div className="mb-4">
          <label className="block text-yellow-400 text-sm mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 bg-black border border-yellow-500 rounded text-white"
            placeholder="Customer Name"
          />
        </div>

        {/* Phone Number Field (Mandatory) */}
        <div className="mb-4">
          <label className="block text-yellow-400 text-sm mb-1">Phone Number (WhatsApp) *</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 bg-black border border-yellow-500 rounded text-white"
            placeholder="017xxxxxxxx"
          />
        </div>

        {/* Email Field (Mandatory) */}
        <div className="mb-4">
          <label className="block text-yellow-400 text-sm mb-1">Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-black border border-yellow-500 rounded text-white"
            placeholder="example@gmail.com"
          />
        </div>

        <h2 className="text-yellow-400 text-xl font-bold mb-3">
          Payment Method
        </h2>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full p-3 mb-5 bg-black border border-yellow-500 rounded text-white"
        >
          <option value="bKash">bKash</option>
          <option value="Nagad">Nagad</option>
          <option value="Card">Card</option>
        </select>

        <button
          type="submit"
          className="block w-full text-center bg-yellow-500 text-black py-3 rounded-lg font-bold cursor-pointer"
        >
          Order on WhatsApp
        </button>

      </form>
    </main>
  );
}