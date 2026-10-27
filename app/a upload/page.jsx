"use client";

import { useState } from "react";
import { db } from "@/lib/firebase"; // Firebase path check korun
import { collection, addDoc } from "firebase/firestore";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    try {
      await addDoc(collection(db, "products"), {
        title,
        price: Number(price),
        description,
        createdAt: new Date(),
      });

      setSuccessMsg("Product uploaded successfully!");
      setTitle("");
      setPrice("");
      setDescription("");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to upload product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold text-yellow-400 mb-6 text-center">
        Upload Product / Feature
      </h1>

      <div className="max-w-xl mx-auto bg-zinc-900 border border-yellow-500 rounded-xl p-6">
        {successMsg && (
          <div className="mb-4 p-3 bg-green-600 text-white rounded">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label className="block text-yellow-400 text-sm mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-black border border-yellow-500 rounded text-white"
              placeholder="Jemon: Netflix Premium 1 Month"
            />
          </div>

          <div className="mb-4">
            <label className="block text-yellow-400 text-sm mb-1">Price (TK) *</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 bg-black border border-yellow-500 rounded text-white"
              placeholder="350"
            />
          </div>

          <div className="mb-4">
            <label className="block text-yellow-400 text-sm mb-1">Description / Features *</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-black border border-yellow-500 rounded text-white h-32"
              placeholder="Product er details ba features ekhane likhun..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="block w-full text-center bg-yellow-500 text-black py-3 rounded-lg font-bold cursor-pointer"
          >
            {loading ? "Uploading..." : "Upload Product"}
          </button>
        </form>
      </div>
    </main>
  );
}