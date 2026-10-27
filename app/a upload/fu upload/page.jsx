"use client";

import { useState } from "react";

export default function OrderCard({ order }) {
  // order object theke data gulo alada kore nooya holo
  const {
    customerName = "Mahabubur kajon",
    customerPhone = "01571282946", // Eta customer-er WhatsApp number hobe
    customerEmail = "customer@gmail.com",
    paymentMethod = "bKash",
    trxId = "gjghjghhjg",
    items = [{ title: "netfilix", quantity: 1, price: 350 }],
    address = "staff quatter 1801/1",
    totalPaid = 350,
    status = "Processing"
  } = order || {};

  return (
    <div className="max-w-3xl mx-auto bg-zinc-900 border border-yellow-500 rounded-xl p-5 mb-6 text-white shadow-lg">
      
      {/* 1. Header Section: Customer Name & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-700 pb-4 mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-yellow-400">
            Customer: {customerName}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Payment: <span className="text-white font-semibold">{paymentMethod}</span> | TrxId: <span className="text-yellow-500">{trxId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Memo Button */}
          <button className="bg-zinc-800 hover:bg-zinc-700 border border-yellow-500/50 text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 transition">
            👁️ View Memo
          </button>
          {/* Delete Button */}
          <button className="bg-red-900/40 hover:bg-red-700 text-red-400 hover:text-white p-2 rounded-lg border border-red-600/50 transition">
            🗑️
          </button>
        </div>
      </div>

      {/* 2. Customer Contact & WhatsApp Direct Link Section */}
      <div className="bg-black/50 p-3 rounded-lg border border-zinc-800 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="text-sm space-y-1">
          <p className="text-zinc-300">
            ✉️ Email: <span className="text-yellow-400">{customerEmail}</span>
          </p>
          <p className="text-zinc-300">
            📞 WhatsApp: <span className="text-yellow-400">{customerPhone}</span>
          </p>
        </div>

        {/* Direct WhatsApp Chat Button */}
        <a
          href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(customerName)},%20regarding%20your%20order%20at%20One%20Shop...`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow"
        >
          💬 Chat on WhatsApp
        </a>
      </div>

      {/* 3. Status Actions Section */}
      <div className="mb-4">
        <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider">Status Actions:</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500 text-yellow-400 rounded-full text-xs font-bold">
            {status}
          </span>
          <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition">Mark Received / Verified</button>
          <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition">Mark Delivered</button>
          <button className="px-3 py-1 bg-red-950/60 hover:bg-red-900 text-red-400 rounded text-xs transition">Cancel Order</button>
        </div>
      </div>

      {/* 4. Items Purchased Section */}
      <div className="bg-black border border-zinc-800 rounded-lg p-3 mb-4">
        <p className="text-xs text-zinc-400 mb-2">Items Purchased:</p>
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-zinc-900 last:border-0">
            <span className="text-zinc-200">• {item.title} (x{item.quantity})</span>
            <span className="text-yellow-400 font-bold">৳{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* 5. Address & Total Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-zinc-400 pt-2 border-t border-zinc-800 gap-2">
        <p>📍 Address: <span className="text-zinc-200">{address}</span></p>
        <p className="text-base font-bold text-yellow-400">
          Total Paid: <span className="text-white">৳{totalPaid}</span>
        </p>
      </div>

    </div>
  );
}