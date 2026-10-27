type PackageCardProps = {
  title: string;
  price: string;
  duration: string;
};

export default function PackageCard({
  title,
  price,
  duration,
}: PackageCardProps) {
  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 hover:scale-105 transition duration-300 shadow-lg">
      <h3 className="text-2xl font-bold text-yellow-400">
        {title}
      </h3>

      <p className="text-gray-300 mt-3">
        {duration}
      </p>

      <h2 className="text-4xl font-bold text-white mt-5">
        {price}
      </h2>

      <button className="w-full mt-8 bg-yellow-500 text-black py-3 rounded-xl font-bold hover:bg-yellow-400">
        Buy Now
      </button>
    </div>
  );
}