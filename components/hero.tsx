export default function Hero() {
  return (
    <section className="bg-black text-center py-24 px-6">
      <h2 className="text-5xl font-extrabold text-yellow-400">
        Premium OTT Subscriptions
      </h2>

      <p className="mt-6 text-gray-300 text-lg max-w-2xl mx-auto">
        Netflix, Prime Video, Disney+, Spotify এবং আরও অনেক Digital
        Subscription এক জায়গায়।
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <button className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-400">
          Buy Now
        </button>

        <button className="border border-yellow-500 text-yellow-400 px-8 py-3 rounded-lg hover:bg-yellow-500 hover:text-black">
          View Packages
        </button>
      </div>
    </section>
  );
}