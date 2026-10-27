"use client";

import { useState } from "react";

export default function OrderPage() {

  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState("bKash");


  const submitOrder = () => {


    const paymentNumber =
      payment === "bKash"
        ? "01571282946"
        : payment === "Nagad"
        ? "01571282946"
        : "01985114997";



    const message = `
📦 New Order

Phone: ${phone}
WhatsApp: ${whatsapp}
Email: ${email}


📦 Product Details:

Product: Netflix Premium
Price: ৳499


💳 Payment Information:

Payment Method: ${payment}
Payment Number: ${paymentNumber}

`;



    const myWhatsapp = "8801XXXXXXXXX";



    window.open(
      `https://wa.me/${myWhatsapp}?text=${encodeURIComponent(message)}`
    );


  };



  return (

    <main className="min-h-screen bg-black text-white flex items-center justify-center">


      <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 w-96">


        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">
          Order Form
        </h1>



        <input

          type="text"

          placeholder="Phone Number"

          className="w-full p-3 mb-3 bg-black border border-gray-600 rounded"

          onChange={(e)=>setPhone(e.target.value)}

        />



        <input

          type="text"

          placeholder="WhatsApp Number"

          className="w-full p-3 mb-3 bg-black border border-gray-600 rounded"

          onChange={(e)=>setWhatsapp(e.target.value)}

        />



        <input

          type="email"

          placeholder="Email"

          className="w-full p-3 mb-3 bg-black border border-gray-600 rounded"

          onChange={(e)=>setEmail(e.target.value)}

        />




        <select

          className="w-full p-3 mb-3 bg-black border border-gray-600 rounded"

          value={payment}

          onChange={(e)=>setPayment(e.target.value)}

        >

          <option>bKash</option>

          <option>Nagad</option>

          <option>Rocket</option>


        </select>





        <div className="w-full p-3 mb-4 bg-black border border-gray-600 rounded text-gray-300">


          Payment Number:

          {
            payment === "bKash"
            ? " 01571282946"
            : payment === "Nagad"
            ? " 01571282946"
            : " 01985114997"
          }


        </div>





        <button

          onClick={submitOrder}

          className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold"

        >

          Confirm Order

        </button>



      </div>


    </main>

  );

}