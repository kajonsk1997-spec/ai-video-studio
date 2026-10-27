"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const savedCart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );
    setCart(savedCart);
  }, []);

  // কার্ট থেকে আইটেম মুছে ফেলার ফাংশন
  const handleRemove = (indexToRemove: number) => {
    const updatedCart = cart.filter((_, index) => index !== indexToRemove);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-yellow-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl text-yellow-400 font-bold text-center mb-6">
          Your Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <p className="text-center text-zinc-500 py-6">
            Your cart is empty.
          </p>
        ) : (
          cart.map((item, index) => (
            <div
              key={index}
              className="border-b border-zinc-800 py-4 flex justify-between items-center gap-3"
            >
              <div>
                {/* ফোল্ডার নেম অনুযায়ী /products/ দেওয়া হয়েছে */}
                <Link href={`/products/${item.id || index}`}>
                  <h2 className="text-base font-bold text-white hover:text-yellow-400 transition cursor-pointer line-clamp-1">
                    {item.name}
                  </h2>
                </Link>

                <p className="text-yellow-400 text-lg font-semibold mt-1">
                  ৳{item.price}
                </p>
              </div>

              {/* ডাস্টবিন বাটন */}
              <button
                onClick={() => handleRemove(index)}
                className="text-zinc-500 hover:text-red-500 p-2 transition cursor-pointer"
                title="Remove item"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}

        {cart.length > 0 && (
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <Link href="/checkout">
              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-xl transition cursor-pointer">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}