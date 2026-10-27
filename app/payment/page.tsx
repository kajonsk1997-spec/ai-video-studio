"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export default function PaymentPage() {

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();

  }, []);


  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">

      <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 w-96 text-center">

        <h1 className="text-3xl font-bold text-yellow-400 mb-6">
          Payment
        </h1>

        {user && (
          <p className="text-gray-300 mb-4">
            {user.email}
          </p>
        )}

        <h2 className="text-2xl font-bold">
          Premium OTT
        </h2>

        <p className="text-4xl text-yellow-400 font-bold mt-5">
          Select Payment
        </p>


        <button className="mt-8 w-full bg-green-500 text-white py-3 rounded-xl font-bold">
          Pay with bKash
        </button>


        <button className="mt-4 w-full bg-orange-500 text-white py-3 rounded-xl font-bold">
          Pay with Nagad
        </button>


      </div>

    </main>
  );
}