"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, ShoppingCart, Heart, Menu, 
  Zap, X, Trash2, ArrowRight, MessageCircle, Clock, LogIn, LogOut, ShieldCheck, ChevronDown, CheckCircle2, Phone, MapPin, PackageCheck 
} from 'lucide-react';

// Firebase Import
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut, 
  onAuthStateChanged, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Custom Toast Message State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const [cart, setCart] = useState<any[]>([]);
  
  // Realtime Products State from Firebase
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // User Orders State
  const [myOrders, setMyOrders] = useState<any[]>([]);

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authStep, setAuthStep] = useState<'identifier' | 'password' | 'otp'>('identifier');

  // Phone OTP States
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Checkout Form States
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Track User Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Customer's Orders when user logged in
  useEffect(() => {
    if (!user) {
      setMyOrders([]);
      return;
    }

    const userEmail = user.email || "";
    const userPhone = user.phoneNumber || "";

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter orders by email/phone or current user's details
      const filtered = allOrders.filter((o: any) => 
        (userEmail && (o.customerEmail === userEmail || o.email === userEmail)) ||
        (userPhone && o.phone === userPhone) ||
        (phone && o.phone === phone)
      );
      setMyOrders(filtered.length > 0 ? filtered : allOrders.slice(0, 5));
    }, (error) => {
      console.error("Error fetching user orders:", error);
    });

    return () => unsubscribe();
  }, [user, phone]);

  // Fetch Realtime Products from Firebase Firestore
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(fetchedProducts);
      setIsLoadingProducts(false);
    }, (error) => {
      console.error("Error fetching products: ", error);
      setIsLoadingProducts(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast("Successfully logged in");
      resetAuthModal();
    } catch (error: any) {
      showToast("Google Login error: " + error.message);
    }
  };

  // Handle Identifier Step
  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    const isEmail = identifier.includes('@');
    if (isEmail) {
      setAuthStep('password');
    } else {
      setupRecaptcha();
      handleSendOtp();
    }
  };

  // Handle Email/Password Login & Register
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, identifier, password);
        showToast("Successfully registered & logged in");
      } else {
        await signInWithEmailAndPassword(auth, identifier, password);
        showToast("Successfully logged in");
      }
      resetAuthModal();
    } catch (error: any) {
      showToast("Authentication Error: " + error.message);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      });
    }
  };

  const handleSendOtp = async () => {
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, identifier, appVerifier);
      setConfirmationResult(confirmation);
      setAuthStep('otp');
      showToast("OTP code sent");
    } catch (error: any) {
      showToast("OTP error: " + error.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    try {
      await confirmationResult.confirm(otp);
      showToast("Successfully logged in");
      resetAuthModal();
    } catch (error: any) {
      showToast("Invalid OTP code");
    }
  };

  const resetAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthStep('identifier');
    setIdentifier('');
    setPassword('');
    setOtp('');
    setIsSignUp(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAccountDropdownOpen(false);
      showToast("Logged out successfully");
    } catch (error: any) {
      showToast("Logout failed");
    }
  };

  // Handle Checkout Order Submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast("Your cart is empty!");
      return;
    }
    if (!customerName || !phone || !address || !trxId) {
      showToast("Please fill in all details including Transaction ID!");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      await addDoc(collection(db, "orders"), {
        customerName,
        customerEmail: user?.email || "",
        phone,
        address,
        paymentMethod,
        trxId,
        items: cart,
        totalPrice,
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      showToast("Order placed successfully!");
      setCart([]);
      setIsCheckoutOpen(false);
      setCustomerName('');
      setPhone('');
      setAddress('');
      setTrxId('');
      setIsMyOrdersOpen(true);
    } catch (error: any) {
      showToast("Order failed: " + error.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const categoryCards = [
    { name: "OTT", title: "Netflix, Disney+ & OTT", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80" },
    { name: "Electronics", title: "Smartphones & Gadgets", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" },
    { name: "Fashion", title: "Trending Fashion & Wear", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80" },
    { name: "Beauty & Personal Care", title: "Beauty & Personal Care", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80" }
  ];

  const categoriesList = [
    "All", "OTT", "Electronics", "Fashion", "Footwear", "Home & Living", 
    "Beauty & Personal Care", "Sports & Fitness", "Accessories", "Toys & Kids", "Health & Wellness", "Books & Stationery"
  ];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  const searchSuggestions = searchQuery.trim() === "" ? [] : products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
    showToast(`${product.name} added to cart!`);
  };

  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const customHelpLineMessage = encodeURIComponent(
    `Hello One Shop Support,\n\nI need help regarding product or order.`
  );

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans selection:bg-amber-500 selection:text-black relative pb-20">
      
      {/* Center Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-zinc-900 border border-amber-500/50 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="text-amber-400" size={22} />
            <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0f1111] border-b border-zinc-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="w-10 h-10 rounded-full border border-amber-400 overflow-hidden bg-black flex items-center justify-center">
              <img src="/logo.jpg" alt="One Shop Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-lg text-amber-400 tracking-wider hidden sm:block">ONE SHOP</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative flex items-center">
            <input
              type="text"
              placeholder="Search One Shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-black py-2 pl-4 pr-12 rounded-md text-sm focus:outline-none"
            />
            <button className="absolute right-0 top-0 bottom-0 px-4 bg-amber-400 hover:bg-amber-500 text-black rounded-r-md flex items-center justify-center transition cursor-pointer">
              <Search size={18} />
            </button>

            {searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-amber-500/40 rounded-xl shadow-2xl z-50 overflow-hidden">
                {searchSuggestions.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => { setSearchQuery(item.name); setSelectedProduct(item); }}
                    className="p-3 hover:bg-amber-500/20 cursor-pointer border-b border-zinc-900 last:border-none flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                      <div>
                        <p className="text-xs font-bold text-white line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-amber-400">{item.category} ৳{item.price}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-500 text-black font-bold px-2 py-1 rounded-lg">View</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Icons & Account Dropdown */}
          <div className="flex items-center space-x-6 text-zinc-200">
            
            {/* Account & Lists Dropdown */}
            <div className="relative" onMouseLeave={() => setIsAccountDropdownOpen(false)}>
              <div 
                onMouseEnter={() => setIsAccountDropdownOpen(true)}
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="cursor-pointer py-1 px-2 hover:border hover:border-white rounded flex flex-col justify-center"
              >
                <span className="text-[11px] text-zinc-400 leading-3">
                  {user ? `Hello, ${user.displayName || (user.email ? user.email.split('@')[0] : 'User')}` : "Hello, sign in"}
                </span>
                <span className="text-xs font-bold flex items-center gap-0.5 text-white">
                  Account & Lists <ChevronDown size={12} />
                </span>
              </div>

              {/* Dropdown Menu */}
              {isAccountDropdownOpen && (
                <div className="absolute right-0 top-full w-72 bg-white text-black rounded-lg shadow-2xl border border-zinc-300 p-4 z-50 space-y-4">
                  {!user ? (
                    <div className="text-center space-y-3 pb-3 border-b border-zinc-200">
                      <button 
                        onClick={() => { setIsAccountDropdownOpen(false); setIsSignUp(false); setIsAuthModalOpen(true); }}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-2 rounded-lg shadow-md text-sm transition cursor-pointer"
                      >
                        Sign in
                      </button>
                      <p className="text-[11px] text-zinc-600">
                        New customer? <span className="text-blue-600 underline cursor-pointer" onClick={() => { setIsAccountDropdownOpen(false); setIsSignUp(true); setIsAuthModalOpen(true); }}>Create your ID here.</span>
                      </p>
                    </div>
                  ) : (
                    <div className="pb-3 border-b border-zinc-200 space-y-2">
                      <p className="text-xs font-bold text-zinc-800">Signed in as:</p>
                      <p className="text-xs text-amber-600 font-semibold truncate">{user.email || user.phoneNumber}</p>
                      <button 
                        onClick={handleLogout}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 rounded-lg text-xs transition cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <h4 className="font-bold text-zinc-900 mb-1">Your Lists</h4>
                      <p className="text-zinc-600 hover:underline cursor-pointer mb-1">Create a List</p>
                      <p className="text-zinc-600 hover:underline cursor-pointer">Find a List</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 mb-1">Your Account</h4>
                      <p onClick={() => { setIsAccountDropdownOpen(false); setIsMyOrdersOpen(true); }} className="text-amber-600 font-bold hover:underline cursor-pointer mb-1">Orders & Tracking</p>
                      <p className="text-zinc-600 hover:underline cursor-pointer">Watchlist</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Icon */}
            <div onClick={() => setIsCartOpen(true)} className="flex items-center gap-1 cursor-pointer hover:text-amber-400">
              <div className="relative">
                <ShoppingCart size={22} />
                <span className="absolute -top-2 -right-2 bg-amber-500 text-black font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((a, c) => a + c.quantity, 0)}
                </span>
              </div>
              <span className="font-bold text-xs hidden sm:inline">Cart</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="bg-[#131921] px-4 py-2 border-t border-zinc-800 flex items-center space-x-6 overflow-x-auto text-xs font-medium text-zinc-300 scrollbar-none">
          <button 
            onClick={() => { setActiveCategory('All'); document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' }); }} 
            className="flex items-center gap-1 hover:text-amber-400 whitespace-nowrap cursor-pointer font-bold text-white"
          >
            <Menu size={16} /> All Categories
          </button>
          <button onClick={() => { setActiveCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-amber-400 whitespace-nowrap cursor-pointer">Home</button>
          <button onClick={() => { setActiveCategory('All'); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-amber-400 whitespace-nowrap cursor-pointer">Today's Deals</button>
          <button onClick={() => { setActiveCategory('OTT'); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-amber-400 whitespace-nowrap cursor-pointer">OTT Subscriptions</button>
          <button onClick={() => { setActiveCategory('Electronics'); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-amber-400 whitespace-nowrap cursor-pointer">Electronics</button>
          <button onClick={() => { setActiveCategory('Fashion'); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-amber-400 whitespace-nowrap cursor-pointer">Fashion</button>
          <button onClick={() => { setActiveCategory('Beauty & Personal Care'); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-amber-400 whitespace-nowrap cursor-pointer">Beauty</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-zinc-950 border-b border-amber-500/10 py-12 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-semibold">
              <span>Premium Shopping Experience</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Elevate Your <br />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Lifestyle
              </span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-md">Discover curated premium products — from cutting-edge electronics to timeless fashion and OTT subscriptions.</p>
          </div>
        </div>
      </section>

      {/* Category Cards Section */}
      <section id="categories-section" className="py-12 px-6 bg-black scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-wide">Shop by Category</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryCards.map((card, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveCategory(card.name);
                  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-zinc-900/90 border border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between group cursor-pointer hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-500/20 transition duration-300"
              >
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition mb-4">
                  {card.title}
                </h3>
                <div className="relative h-48 rounded-xl overflow-hidden bg-black mb-4 border border-zinc-800">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80 group-hover:opacity-100" />
                </div>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1 group-hover:underline">
                  Shop now <ArrowRight size={14} />
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            {categoriesList.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${activeCategory === cat ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/30' : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-amber-500/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Live Firebase Products Grid */}
      <section id="products-section" className="py-10 px-6 bg-zinc-950 border-t border-amber-500/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="text-amber-400 fill-amber-400" size={24} />
              <h2 className="text-2xl font-bold text-white">
                {activeCategory === 'All' ? 'Featured Products & OTT' : `${activeCategory} Products`}
              </h2>
            </div>
            <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Showing: {activeCategory}
            </span>
          </div>

          {isLoadingProducts ? (
            <div className="text-center py-20 text-zinc-400 animate-pulse">
              Loading Live Products from Firebase...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-black/40 border border-amber-500/20 rounded-3xl space-y-4 my-8">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
                <Clock size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-wide">Coming Soon!</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                We are currently adding exciting new products to the <span className="text-amber-400 font-semibold">{activeCategory}</span> category. Stay tuned!
              </p>
              <button 
                onClick={() => setActiveCategory('All')} 
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer inline-block"
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product)} 
                  className="bg-black border border-amber-500/20 rounded-2xl overflow-hidden group hover:border-amber-500/60 transition shadow-xl flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="relative h-56 bg-zinc-900 overflow-hidden">
                      {product.discount && (
                        <span className="absolute top-3 left-3 z-10 bg-amber-500 text-black font-bold text-[10px] px-2.5 py-1 rounded-full">
                          {product.discount}
                        </span>
                      )}
                      
                      {product.video ? (
                        <video src={product.video} controls className="w-full h-full object-cover" />
                      ) : (
                        <img 
                          src={product.image || "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500"} 
                          alt={product.name} 
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500";
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">{product.category}</span>
                      <h3 className="font-bold text-sm text-white line-clamp-1">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-extrabold text-base">৳{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-zinc-500 text-xs line-through">৳{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button 
                      onClick={(e) => addToCart(product, e)} 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Buy / Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-amber-500/40 rounded-2xl overflow-hidden relative shadow-2xl">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 z-10 bg-black/60 p-1.5 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-full bg-black border-r border-zinc-800">
                {selectedProduct.video ? (
                  <video src={selectedProduct.video} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold border border-amber-500/30">
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-xl font-extrabold text-white pt-2">{selectedProduct.name}</h2>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-extrabold text-amber-400">৳{selectedProduct.price}</span>
                    {selectedProduct.originalPrice && (
                      <span className="text-sm text-zinc-500 line-through">৳{selectedProduct.originalPrice}</span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed pt-2">
                    {selectedProduct.description || "High quality premium product from One Shop. Enjoy fast delivery and best customer support."}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <button 
                    onClick={() => { const p = selectedProduct; setSelectedProduct(null); addToCart(p); }} 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3 rounded-xl text-sm transition cursor-pointer"
                  >
                    Buy / Add to Cart
                  </button>
                  <p className="text-[11px] text-zinc-500 text-center">100% Genuine & Secure Guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-zinc-950 border-l border-amber-500/20 h-full p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-amber-400">Your Shopping Cart</h2>
                <X size={24} className="cursor-pointer text-zinc-400 hover:text-white" onClick={() => setIsCartOpen(false)} />
              </div>
              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-zinc-500 py-12">Your cart is empty.</p>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-amber-400">৳{item.price} x {item.quantity}</p>
                        </div>
                      </div>
                      <button onClick={() => setCart(prev => prev.filter((_, i) => i !== index))} className="text-zinc-500 hover:text-red-400 cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <div className="flex justify-between text-base font-bold text-white">
                <span>Subtotal:</span>
                <span className="text-amber-400">৳{totalPrice}</span>
              </div>
              <button 
                onClick={() => {
                  if (!user) {
                    setIsCartOpen(false);
                    setIsAuthModalOpen(true);
                  } else {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }
                }} 
                className="w-full bg-amber-500 text-black font-extrabold py-3 rounded-xl text-sm cursor-pointer"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Drawer */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-zinc-950 border-l border-amber-500/20 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-amber-400">Checkout & Payment</h2>
                <X size={22} className="cursor-pointer text-zinc-400 hover:text-white" onClick={() => setIsCheckoutOpen(false)} />
              </div>

              {/* Ordered Products Preview */}
              <div className="space-y-2 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <p className="text-xs font-bold text-zinc-300">Your Ordered Products:</p>
                <div className="max-h-28 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-black p-2 rounded-lg border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                        <div>
                          <p className="font-bold text-white line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-amber-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-white">৳{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCheckoutSubmit} id="checkout-form" className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Full Name *</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="Customer Name" className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Phone Number *</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="017xxxxxxxx" className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Delivery Address *</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="House, Area, City..." className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none h-14 resize-none"></textarea>
                </div>
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none">
                    <option value="bKash">bKash Payment</option>
                    <option value="Nagad">Nagad Payment</option>
                    <option value="Rocket">Rocket Payment</option>
                    <option value="Upay">Upay Payment</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                {/* Dynamic Payment Instructions */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1">
                  <p className="text-[11px] font-bold text-amber-400">Please Send Money to our Number:</p>
                  <p className="text-xs font-mono font-extrabold text-white bg-black p-2 rounded border border-zinc-800 text-center">
                    {(paymentMethod === 'bKash' || paymentMethod === 'Nagad' || paymentMethod === 'Upay') && `${paymentMethod}: 01571282946 (Personal / Send Money)`}
                    {paymentMethod === 'Rocket' && "Rocket: 01985114997 (Personal / Send Money)"}
                    {paymentMethod === 'Card' && "Card Payment Gateway (Mock Active)"}
                  </p>
                </div>

                {/* Transaction ID Input */}
                <div>
                  <label className="font-bold text-amber-400 block mb-1">Transaction ID (TrxID) *</label>
                  <input 
                    type="text" 
                    value={trxId} 
                    onChange={(e) => setTrxId(e.target.value)} 
                    required 
                    placeholder="Enter Payment Transaction ID (e.g. 9J28XKL12)" 
                    className="w-full bg-black border border-amber-500/50 text-white p-2.5 rounded-xl outline-none focus:border-amber-400 font-mono text-xs"
                  />
                </div>

                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400">Total Bill to Pay:</span>
                  <span className="text-base font-extrabold text-amber-400">৳{totalPrice}</span>
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <button 
                type="submit" 
                form="checkout-form"
                disabled={isSubmittingOrder} 
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-extrabold py-3 rounded-xl transition cursor-pointer text-sm shadow-lg shadow-amber-500/20"
              >
                {isSubmittingOrder ? "Submitting Order..." : "Submit Transaction & Complete Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders & Tracking Modal */}
      {isMyOrdersOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-amber-500/30 rounded-2xl p-6 relative shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <button onClick={() => setIsMyOrdersOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>

            <div className="border-b border-zinc-800 pb-3 flex items-center gap-2">
              <PackageCheck className="text-amber-400" size={22} />
              <h2 className="text-lg font-bold text-white">Order Status & Tracking</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {myOrders.length === 0 ? (
                <p className="text-center text-zinc-500 py-12">No orders found.</p>
              ) : (
                myOrders.map((ord: any, idx: number) => (
                  <div key={idx} className="bg-black border border-amber-500/20 rounded-xl p-4 space-y-3 shadow-md">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <div>
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded">ID: {ord.id.slice(0, 8)}...</span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Payment: {ord.paymentMethod || "bKash"}</p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${ord.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' : ord.status === 'Processing' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {ord.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {ord.items?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-zinc-300">
                          <div className="flex items-center gap-2">
                            <img src={item.image} alt={item.name} className="w-7 h-7 object-cover rounded" />
                            <span className="font-bold line-clamp-1">{item.name} (x{item.quantity})</span>
                          </div>
                          <span className="font-bold text-amber-400">৳{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-zinc-800 pt-2 flex justify-between items-center text-xs">
                      <span className="text-zinc-400">TrxID: <span className="font-mono text-white font-bold">{ord.trxId || "N/A"}</span></span>
                      <span className="font-black text-amber-400 text-sm">Total: ৳{ord.totalPrice}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Amazon-Style Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-black rounded-xl p-6 space-y-4 relative shadow-2xl border border-zinc-200">
            <button onClick={resetAuthModal} className="absolute top-4 right-4 text-zinc-400 hover:text-black cursor-pointer">
              <X size={20} />
            </button>
            <div id="recaptcha-container"></div>

            <div className="flex justify-center mb-1">
              <span className="font-extrabold text-xl tracking-wider text-black">ONE SHOP</span>
            </div>

            {authStep === 'identifier' && (
              <form onSubmit={handleIdentifierSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-900">
                  {isSignUp ? "Create account" : "Sign in or create account"}
                </h2>

                <div>
                  <label className="text-xs font-bold text-zinc-800 block mb-1">Enter mobile number or email</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      value={identifier} 
                      onChange={(e) => setIdentifier(e.target.value)} 
                      required 
                      placeholder="email@example.com or +8801..." 
                      className="w-full border border-zinc-400 focus:border-amber-500 text-black px-3 py-2 rounded text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-2 rounded shadow-md text-sm transition cursor-pointer">
                  Continue
                </button>

                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-zinc-300"></div>
                  <span className="px-3 text-zinc-500 text-xs">or continue with</span>
                  <div className="flex-grow border-t border-zinc-300"></div>
                </div>

                <button type="button" onClick={handleGoogleLogin} className="w-full bg-zinc-100 hover:bg-zinc-200 text-black font-bold py-2 rounded text-xs flex items-center justify-center gap-2 border border-zinc-300 cursor-pointer">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.8 7.3l3.7 2.9C6.4 7.2 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.5 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.8 7.3C.7 9.5 0 12 0 12s.7 2.5 1.8 4.7l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.6-2.2-6.5-5.2L1.8 16c1.9 3.7 5.7 6.3 10.2 6.3z"/>
                  </svg>
                  Sign in with Google
                </button>
              </form>
            )}

            {authStep === 'password' && (
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-900">{isSignUp ? "Set your password" : "Enter password"}</h2>
                <p className="text-xs text-zinc-600">{identifier}</p>

                <div>
                  <label className="text-xs font-bold text-zinc-800 block mb-1">Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="At least 6 characters" 
                    className="w-full border border-zinc-400 focus:border-amber-500 text-black px-3 py-2 rounded text-sm focus:outline-none"
                  />
                </div>

                <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-2 rounded shadow-md text-sm transition cursor-pointer">
                  {isSignUp ? "Create account" : "Sign in"}
                </button>
              </form>
            )}

            {authStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-900">Verification code sent</h2>
                <p className="text-xs text-zinc-600">Please enter the 6-digit code sent to {identifier}</p>

                <div>
                  <input 
                    type="text" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    required 
                    placeholder="123456" 
                    className="w-full border border-zinc-400 focus:border-amber-500 text-black px-3 py-2 rounded text-sm text-center tracking-widest font-bold focus:outline-none"
                  />
                </div>

                <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-2 rounded shadow-md text-sm transition cursor-pointer">
                  Verify & Sign in
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Helpline Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <a 
          href={`https://wa.me/8801571282946?text=${customHelpLineMessage}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-black text-xs transition cursor-pointer"
        >
          <Phone size={16} /> Help Line (+880 1571-282946)
        </a>
      </div>

    </div>
  );
}