export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-yellow-500 bg-black">
      <h1 className="text-3xl font-bold text-yellow-400">
        ONE SHOP
      </h1>

      <div className="flex gap-6 text-white">
        <a href="#" className="hover:text-yellow-400">Home</a>
        <a href="#" className="hover:text-yellow-400">OTT</a>
        <a href="#" className="hover:text-yellow-400">Shop</a>
        <a href="#" className="hover:text-yellow-400">Contact</a>
      </div>

      <button className="bg-yellow-500 text-black px-5 py-2 rounded-lg font-bold">
        Login
      </button>
    </nav>
  );
}