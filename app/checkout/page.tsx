"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("bKash");

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <h1 className="text-5xl font-bold text-yellow-400">
        Checkout
      </h1>

      <div className="mt-10 max-w-xl bg-zinc-900 border border-yellow-500 rounded-xl p-6">

        <input
          className="w-full p-3 mb-4 bg-black border border-yellow-500 rounded"
          placeholder="Full Name"
        />

        <input
          className="w-full p-3 mb-4 bg-black border border-yellow-500 rounded"
          placeholder="Phone Number"
        />

        <input
          className="w-full p-3 mb-4 bg-black border border-yellow-500 rounded"
          placeholder="Email"
        />

        <h2 className="text-yellow-400 text-xl font-bold mb-3">
          Payment Method
        </h2>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full p-3 mb-5 bg-black border border-yellow-500 rounded"
        >
          <option>bKash</option>
          <option>Nagad</option>
          <option>Card</option>
        </select>

        <a
          href={`https://wa.me/8801571282946?text=New%20Order%20-%20One%20Shop%0A%0APayment%20Method:%20${paymentMethod}%0APayment%20Number:%2001571282946`}
          target="_blank"
          className="block w-full text-center bg-yellow-500 text-black py-3 rounded-lg font-bold"
        >
          Order on WhatsApp
        </a>

      </div>

    </main>
  );
}