"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, ShoppingCart, Heart, Menu, 
  Zap, X, Trash2, ArrowRight, MessageCircle, Clock, LogIn, LogOut, ShieldCheck, ChevronDown, CheckCircle2, Phone, MapPin, PackageCheck, Copy, Check, Tag, Star, Mail, Download, MessageSquare, Flame, Settings, Plus
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
  ConfirmationResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  
  // Admin Panel Modal State (Can be opened programmatically if needed)
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [newTitle1, setNewTitle1] = useState('');
  const [newTitle2, setNewTitle2] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCoupon, setNewCoupon] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState('image'); // 'image' or 'video'
  const [newTargetCategory, setNewTargetCategory] = useState('OTT');
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  // Feature Modals & States
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatList, setChatList] = useState([
    { sender: 'bot', text: 'Hello! Welcome to One Shop. How can I help you today?' }
  ]);

  // Review & Rating Modal State
  const [reviewModalProduct, setReviewModalProduct] = useState<any>(null);
  const [userRating, setUserRating] = useState(5);
  const [userReviewText, setUserReviewText] = useState('');
  const [productReviews, setProductReviews] = useState<any[]>([]);

  // Hero Slider & Admin Banners State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [adminBanners, setAdminBanners] = useState<any[]>([]);

  const defaultBanners = [
    {
      id: "1",
      titleLine1: "Elevate Your",
      titleLine2: "Lifestyle",
      description: "Discover curated premium products.",
      couponText: "Use code ONE10 for 10% off",
      mediaUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80",
      mediaType: "image",
      targetCategory: "OTT"
    },
    {
      id: "2",
      titleLine1: "Smartphones &",
      titleLine2: "Gadgets",
      description: "Explore cutting-edge technology.",
      couponText: "Use code ONE10 for 10% off",
      mediaUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      mediaType: "image",
      targetCategory: "Electronics"
    }
  ];

  useEffect(() => {
    const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBanners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (fetchedBanners.length > 0) {
        setAdminBanners(fetchedBanners);
      } else {
        setAdminBanners(defaultBanners);
      }
    }, (error) => {
      console.error("Error fetching banners:", error);
      setAdminBanners(defaultBanners);
    });

    return () => unsubscribe();
  }, []);

  // Automatic Slider Effect (every 5 seconds)
  useEffect(() => {
    if (adminBanners.length <= 1) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % adminBanners.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [adminBanners]);

  const handleAddBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl) {
      showToast("Please provide Media URL (Image or 5s Video)!");
      return;
    }

    setIsAddingBanner(true);
    try {
      await addDoc(collection(db, "banners"), {
        titleLine1: newTitle1 || "Special Offer",
        titleLine2: newTitle2 || "Discount",
        description: newDesc || "Explore exclusive deals today.",
        couponText: newCoupon || "Use code ONE10 for 10% off",
        mediaUrl: newMediaUrl,
        mediaType: newMediaType,
        targetCategory: newTargetCategory,
        createdAt: serverTimestamp()
      });
      showToast("Banner/Video added successfully!");
      setNewTitle1('');
      setNewTitle2('');
      setNewDesc('');
      setNewCoupon('');
      setNewMediaUrl('');
    } catch (error: any) {
      showToast("Error adding banner: " + error.message);
    } finally {
      setIsAddingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, "banners", id));
      showToast("Banner removed successfully!");
    } catch (error: any) {
      showToast("Error deleting banner: " + error.message);
    }
  };

  // Flash Sale Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 6, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  const [user, setUser] = useState<any>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authStep, setAuthStep] = useState<'identifier' | 'password' | 'otp'>('identifier');

  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  
  const [lastOrderWhatsAppLink, setLastOrderWhatsAppLink] = useState<string | null>(null);

  const getPaymentNumber = () => {
    if (paymentMethod === 'Rocket') return '01985114997';
    return '01571282946';
  };

  const handleCopyNumber = () => {
    const num = getPaymentNumber();
    navigator.clipboard.writeText(num);
    setIsCopied(true);
    showToast(`Number ${num} copied!`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'ONE10') {
      setAppliedDiscount(10);
      setCouponError('');
      showToast('10% Discount Applied!');
    } else {
      setCouponError('Invalid Coupon Code! (Try: ONE10)');
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier || !identifier.includes('@')) {
      showToast("Please enter your email address in the box first!");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, identifier);
      showToast("Password reset link sent to your email!");
    } catch (error: any) {
      showToast("Reset Error: " + error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

  const rawTotalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = Math.round((rawTotalPrice * appliedDiscount) / 100);
  const totalPrice = rawTotalPrice - discountAmount;

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
      const orderData = {
        customerName,
        customerEmail: user?.email || "dhsk19990@gmail.com",
        phone,
        address,
        paymentMethod,
        trxId,
        items: cart,
        totalPrice,
        appliedDiscount: `${appliedDiscount}%`,
        status: 'Pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "orders"), orderData);

      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
      } catch (err) {
        console.log("Email Dispatch Hook Triggered");
      }

      const itemsText = cart.map(i => `• ${i.name} (x${i.quantity}) - ৳${i.price * i.quantity}`).join('\n');
      const waMessage = encodeURIComponent(
        `🛍️ *NEW ORDER - ONE SHOP*\n\n` +
        `👤 *Name:* ${customerName}\n` +
        `📞 *Phone:* ${phone}\n` +
        `📍 *Address:* ${address}\n\n` +
        `🛒 *Items:*\n${itemsText}\n\n` +
        `💳 *Payment:* ${paymentMethod}\n` +
        `🔑 *TrxID:* ${trxId}\n` +
        `💰 *Total Bill:* ৳${totalPrice}\n\n` +
        `Status: Pending Verification`
      );
      const waLink = `https://wa.me/8801571282946?text=${waMessage}`;
      setLastOrderWhatsAppLink(waLink);

      showToast("Order Placed Successfully!");
      setCart([]);
      setIsCheckoutOpen(false);
      setCustomerName('');
      setPhone('');
      setAddress('');
      setTrxId('');
      setCouponCode('');
      setAppliedDiscount(0);
      setIsMyOrdersOpen(true);
    } catch (error: any) {
      showToast("Order failed: " + error.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

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

  const toggleWishlist = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showToast("Removed from Wishlist");
        return prev.filter(item => item.id !== product.id);
      } else {
        showToast("Added to Wishlist");
        return [...prev, product];
      }
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const newRev = {
      user: user.email ? user.email.split('@')[0] : 'Customer',
      rating: userRating,
      text: userReviewText,
      date: new Date().toLocaleDateString()
    };
    setProductReviews(prev => [newRev, ...prev]);
    setUserReviewText('');
    showToast("Review submitted successfully!");
  };

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatList(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatMessage('');
    setTimeout(() => {
      let botReply = "Thank you for reaching out! For quick support, please call our hotline at 01571282946 or WhatsApp us.";
      const low = userMsg.toLowerCase();
      if (low.includes('price') || low.includes('cost')) botReply = "Prices are listed on each product card. We offer flat 10% off with coupon code ONE10!";
      if (low.includes('delivery') || low.includes('shipping')) botReply = "We provide fast delivery across Bangladesh within 2-3 business days.";
      if (low.includes('bkash') || low.includes('payment')) botReply = "You can pay via bKash, Nagad, or Rocket using our merchant/personal send money numbers shown at checkout.";
      setChatList(prev => [...prev, { sender: 'bot', text: botReply }]);
    }, 1000);
  };

  const customHelpLineMessage = encodeURIComponent(
    `Hello One Shop Support,\n\nI need help regarding product or order.`
  );

  const currentSlideData = adminBanners[currentSlide] || adminBanners[0] || defaultBanners[0];

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans selection:bg-amber-500 selection:text-black relative pb-20">
      
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

          <div className="flex items-center space-x-5 text-zinc-200">
            <div onClick={() => setIsWishlistOpen(true)} className="relative cursor-pointer hover:text-amber-400 flex items-center gap-1">
              <div className="relative">
                <Heart size={22} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-black font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold hidden sm:inline">Wishlist</span>
            </div>

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

              {isAccountDropdownOpen && (
                <div className="absolute right-0 top-full w-56 bg-white text-black rounded-lg shadow-2xl border border-zinc-300 p-4 z-50 space-y-3">
                  {!user ? (
                    <div className="text-center space-y-2 pb-3 border-b border-zinc-200">
                      <button 
                        onClick={() => { setIsAccountDropdownOpen(false); setIsSignUp(false); setIsAuthModalOpen(true); }}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-2 rounded-lg shadow-md text-sm transition cursor-pointer"
                      >
                        Sign in
                      </button>
                      <p className="text-[11px] text-zinc-600">
                        New customer? <span className="text-blue-600 underline cursor-pointer" onClick={() => { setIsAccountDropdownOpen(false); setIsSignUp(true); setIsAuthModalOpen(true); }}>Create your ID.</span>
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

                  <div className="space-y-2 text-xs">
                    <p onClick={() => { setIsAccountDropdownOpen(false); setIsMyOrdersOpen(true); }} className="text-amber-600 font-bold hover:underline cursor-pointer block">Orders & Tracking</p>
                  </div>
                </div>
              )}
            </div>

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
        </div>
      </header>

      {/* Hero Section with Automatic Sliding & Clickable Redirect (Clean Media Style) */}
      <section className="relative bg-zinc-950 border-b border-amber-500/10 py-12 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text & Coupon Badge (Automatic sliding change) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left min-h-[220px] flex flex-col justify-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-semibold mx-auto lg:mx-0 w-fit">
              <Flame size={14} className="text-amber-400 animate-pulse" />
              <span>{currentSlideData.couponText || "Use code ONE10 for 10% off"}</span>
            </div>

            <div className="transition-all duration-700 ease-in-out space-y-2">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {currentSlideData.titleLine1} <br />
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                  {currentSlideData.titleLine2}
                </span>
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 pt-2">
                {currentSlideData.description}
              </p>
            </div>
          </div>

          {/* Right Side: Clickable Auto-sliding Picture or 5s Video Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div 
              onClick={() => {
                setActiveCategory(currentSlideData.targetCategory || 'All');
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative w-full max-w-lg h-72 rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-black group cursor-pointer"
            >
              {currentSlideData.mediaType === 'video' ? (
                <video 
                  src={currentSlideData.mediaUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
              ) : (
                <img 
                  src={currentSlideData.mediaUrl} 
                  alt="Banner Media" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <span className="text-xs font-bold text-amber-400 bg-black/60 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                  Explore {currentSlideData.targetCategory || 'Deals'} <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Admin Panel Modal (Can be triggered via console or admin script) */}
      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-950 border border-amber-500/50 rounded-2xl p-6 relative shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <button onClick={() => setIsAdminPanelOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer">
              <X size={22} />
            </button>

            <div className="border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Settings className="text-amber-400" size={24} />
              <h2 className="text-xl font-bold text-white">Admin Panel: Manage 5s Video & Banners</h2>
            </div>

            <form onSubmit={handleAddBannerSubmit} className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-3 text-xs">
              <p className="font-bold text-amber-400 text-sm">Add New Slide (Image or 5s Video):</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Title Line 1</label>
                  <input type="text" value={newTitle1} onChange={(e) => setNewTitle1(e.target.value)} placeholder="e.g. Elevate Your" className="w-full bg-black border border-zinc-700 text-white p-2 rounded outline-none" />
                </div>
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Title Line 2 (Highlighted)</label>
                  <input type="text" value={newTitle2} onChange={(e) => setNewTitle2(e.target.value)} placeholder="e.g. Lifestyle" className="w-full bg-black border border-zinc-700 text-white p-2 rounded outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Media Type</label>
                  <select value={newMediaType} onChange={(e) => setNewMediaType(e.target.value)} className="w-full bg-black border border-zinc-700 text-white p-2 rounded outline-none">
                    <option value="image">Image</option>
                    <option value="video">5s Video (MP4)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Target Category (Redirect)</label>
                  <input type="text" value={newTargetCategory} onChange={(e) => setNewTargetCategory(e.target.value)} placeholder="e.g. OTT or Electronics" className="w-full bg-black border border-zinc-700 text-white p-2 rounded outline-none" />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Media URL (Image or Video link) *</label>
                <input type="text" value={newMediaUrl} onChange={(e) => setNewMediaUrl(e.target.value)} required placeholder="https://..." className="w-full bg-black border border-zinc-700 text-white p-2 rounded outline-none" />
              </div>

              <button type="submit" disabled={isAddingBanner} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-2.5 rounded-lg transition cursor-pointer">
                {isAddingBanner ? "Adding..." : "Add to Auto-Slider"}
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <p className="font-bold text-zinc-300">Existing Slides ({adminBanners.length}):</p>
              {adminBanners.map((banner, index) => (
                <div key={banner.id || index} className="bg-black border border-zinc-800 p-3 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                      {banner.mediaType === 'video' ? (
                        <video src={banner.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={banner.mediaUrl} alt="Slide" className="w-full h-full object-cover" />
                      )}
                    </span>
                    <div>
                      <p className="font-bold text-white">{banner.titleLine1} <span className="text-amber-400">{banner.titleLine2}</span></p>
                      <p className="text-[10px] text-zinc-400">Redirects to: {banner.targetCategory}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* FLASH SALE SECTION */}
      <section className="py-10 px-6 bg-[#0c0d10] border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/80 border border-amber-500/40 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 text-black rounded-xl flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
                <Flame size={26} className="fill-black animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                  LIMITED TIME FLASH SALE
                </h2>
                <p className="text-xs text-zinc-400">Grab your favourite products before the deal ends!</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-black border border-amber-500/30 px-3 py-2 rounded-xl text-center">
                <span className="text-lg font-extrabold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                <p className="text-[9px] text-zinc-400 uppercase">Hours</p>
              </div>
              <span className="text-amber-400 font-bold">:</span>
              <div className="bg-black border border-amber-500/30 px-3 py-2 rounded-xl text-center">
                <span className="text-lg font-extrabold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <p className="text-[9px] text-zinc-400 uppercase">Mins</p>
              </div>
              <span className="text-amber-400 font-bold">:</span>
              <div className="bg-black border border-amber-500/30 px-3 py-2 rounded-xl text-center">
                <span className="text-lg font-extrabold text-amber-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <p className="text-[9px] text-zinc-400 uppercase">Secs</p>
              </div>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-4 pt-2 scrollbar-none">
            {products.slice(0, 6).map((product) => {
              const isFavorited = wishlist.some(item => item.id === product.id);
              return (
                <div 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product)}
                  className="min-w-[260px] sm:min-w-[280px] bg-black border border-amber-500/30 rounded-2xl overflow-hidden group hover:border-amber-500 transition shadow-xl flex flex-col justify-between cursor-pointer relative shrink-0"
                >
                  <button 
                    onClick={(e) => toggleWishlist(product, e)}
                    className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition ${isFavorited ? 'bg-amber-500 text-black' : 'bg-black/60 text-white hover:text-amber-400'}`}
                  >
                    <Heart size={16} className={isFavorited ? 'fill-black' : ''} />
                  </button>

                  <div>
                    <div className="relative h-48 bg-zinc-900 overflow-hidden">
                      <span className="absolute top-3 left-3 z-10 bg-red-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Flash Deal
                      </span>
                      {product.video ? (
                        <video src={product.video} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Shop by Category Filter Section */}
      <section id="categories-section" className="py-12 px-6 bg-black scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-wide">Shop by Category</h2>
          
          <div className="flex overflow-x-auto gap-2 pt-2 scrollbar-none pb-2">
            {categoriesList.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${activeCategory === cat ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/30' : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-amber-500/50'}`}
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
              {filteredProducts.map(product => {
                const isFavorited = wishlist.some(item => item.id === product.id);
                return (
                  <div 
                    key={product.id} 
                    onClick={() => setSelectedProduct(product)} 
                    className="bg-black border border-amber-500/20 rounded-2xl overflow-hidden group hover:border-amber-500/60 transition shadow-xl flex flex-col justify-between cursor-pointer relative"
                  >
                    <button 
                      onClick={(e) => toggleWishlist(product, e)}
                      className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition ${isFavorited ? 'bg-amber-500 text-black' : 'bg-black/60 text-white hover:text-amber-400'}`}
                    >
                      <Heart size={16} className={isFavorited ? 'fill-black' : ''} />
                    </button>

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
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">{product.category}</span>
                          <div 
                            onClick={(e) => { e.stopPropagation(); setReviewModalProduct(product); }}
                            className="flex items-center gap-1 text-amber-400 text-[10px] hover:underline cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30"
                          >
                            <Star size={12} className="fill-amber-400" />
                            <span>Reviews</span>
                          </div>
                        </div>
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
                );
              })}
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

      {/* Wishlist Drawer */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-zinc-950 border-l border-amber-500/20 h-full p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                  <Heart className="fill-amber-400 text-amber-400" size={20} /> My Wishlist
                </h2>
                <X size={24} className="cursor-pointer text-zinc-400 hover:text-white" onClick={() => setIsWishlistOpen(false)} />
              </div>
              <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {wishlist.length === 0 ? (
                  <p className="text-center text-zinc-500 py-12">Your wishlist is empty.</p>
                ) : (
                  wishlist.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-amber-400">৳{item.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { addToCart(item); setWishlist(prev => prev.filter(w => w.id !== item.id)); }} className="bg-amber-500 text-black text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer">
                          Add to Cart
                        </button>
                        <button onClick={() => setWishlist(prev => prev.filter(w => w.id !== item.id))} className="text-zinc-500 hover:text-red-400 cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <button onClick={() => setIsWishlistOpen(false)} className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Product Review Modal */}
      {reviewModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-amber-500/40 rounded-2xl p-6 relative shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <button onClick={() => setReviewModalProduct(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <img src={reviewModalProduct.image} alt={reviewModalProduct.name} className="w-12 h-12 object-cover rounded-xl" />
              <div>
                <h3 className="font-bold text-white text-sm line-clamp-1">{reviewModalProduct.name}</h3>
                <p className="text-xs text-amber-400 font-semibold">Ratings & Reviews</p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-2 text-xs">
              <p className="font-bold text-zinc-300">Leave Your Review:</p>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Rating:</span>
                <select value={userRating} onChange={(e) => setUserRating(Number(e.target.value))} className="bg-black border border-zinc-700 text-amber-400 font-bold p-1 rounded outline-none">
                  <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5)</option>
                  <option value="3">⭐⭐⭐ (3/5)</option>
                  <option value="2">⭐⭐ (2/5)</option>
                  <option value="1">⭐ (1/5)</option>
                </select>
              </div>
              <textarea 
                value={userReviewText} 
                onChange={(e) => setUserReviewText(e.target.value)} 
                required 
                placeholder="Write your experience with this product..." 
                className="w-full bg-black border border-zinc-700 text-white p-2 rounded-lg outline-none h-16 resize-none"
              ></textarea>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 rounded-lg transition cursor-pointer">
                Submit Review
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <p className="font-bold text-zinc-400">Customer Feedback ({productReviews.length + 1}):</p>
              <div className="bg-black border border-zinc-800 p-3 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>Rahim Ahmed</span>
                  <span className="text-amber-400">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-zinc-400 text-[11px]">Excellent product! Genuine quality and super fast delivery from One Shop.</p>
                <span className="text-[9px] text-zinc-600">2 days ago</span>
              </div>
              {productReviews.map((rev, i) => (
                <div key={i} className="bg-black border border-zinc-800 p-3 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>{rev.user}</span>
                    <span className="text-amber-400">{"⭐".repeat(rev.rating)}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">{rev.text}</p>
                  <span className="text-[9px] text-zinc-600">{rev.date}</span>
                </div>
              ))}
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
                <span className="text-amber-400">৳{rawTotalPrice}</span>
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
                <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <Mail size={18} /> Checkout & Notification
                </h2>
                <X size={22} className="cursor-pointer text-zinc-400 hover:text-white" onClick={() => setIsCheckoutOpen(false)} />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-400 flex items-center gap-2">
                <MessageCircle size={16} /> Order confirmation goes to Email & WhatsApp instantly!
              </div>

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
                  <label className="font-bold text-zinc-300 block mb-1">Phone Number (WhatsApp) *</label>
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
                  </select>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-2">
                  <p className="text-[11px] font-bold text-amber-400">Please Send Money to our Number:</p>
                  <div className="flex items-center justify-between bg-black p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-xs font-mono font-extrabold text-white">
                      {paymentMethod}: <span className="text-amber-400">{getPaymentNumber()}</span> (Send Money)
                    </span>
                    <button 
                      type="button" 
                      onClick={handleCopyNumber}
                      className="bg-amber-500 hover:bg-amber-600 text-black px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      {isCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-300 flex items-center gap-1">
                    <Tag size={12} className="text-amber-400" /> Promo / Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCode} 
                      onChange={(e) => setCouponCode(e.target.value)} 
                      placeholder="Use: ONE10 for 10% Off" 
                      className="flex-1 bg-black border border-zinc-700 text-white p-2 rounded-xl outline-none uppercase text-xs font-mono"
                    />
                    <button 
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-amber-500 hover:bg-amber-600 text-black px-4 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-400 mt-1">{couponError}</p>}
                </div>

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

                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span>৳{rawTotalPrice}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Discount ({appliedDiscount}%):</span>
                      <span>-৳{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-extrabold text-sm pt-1 border-t border-zinc-800">
                    <span>Total Bill to Pay:</span>
                    <span className="text-amber-400">৳{totalPrice}</span>
                  </div>
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
                {isSubmittingOrder ? "Submitting Order..." : "Submit Transaction & Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders & Invoice Modal */}
      {isMyOrdersOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-amber-500/30 rounded-2xl p-6 relative shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <button onClick={() => setIsMyOrdersOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>

            <div className="border-b border-zinc-800 pb-3 flex items-center gap-2">
              <PackageCheck className="text-amber-400" size={22} />
              <h2 className="text-lg font-bold text-white">Order Status & Invoices</h2>
            </div>

            {lastOrderWhatsAppLink && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <MessageCircle size={18} /> Send order to WhatsApp:
                </div>
                <a 
                  href={lastOrderWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold px-3 py-1.5 rounded-lg shadow-md transition"
                >
                  Send WhatsApp
                </a>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {myOrders.length === 0 ? (
                <p className="text-center text-zinc-500 py-12">No orders found.</p>
              ) : (
                myOrders.map((ord: any, idx: number) => {
                  const status = ord.status || 'Pending';
                  return (
                    <div key={idx} className="bg-black border border-amber-500/20 rounded-xl p-4 space-y-4 shadow-md">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                        <div>
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded">ID: {ord.id.slice(0, 8)}...</span>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Payment: {ord.paymentMethod || "bKash"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setActiveInvoice(ord)}
                            className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Download size={12} /> Invoice
                          </button>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {ord.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-zinc-300">
                            <span className="font-bold line-clamp-1">{item.name} (x{item.quantity})</span>
                            <span className="font-bold text-amber-400">৳{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-zinc-800 pt-2 flex justify-between items-center text-xs">
                        <span className="text-zinc-400">TrxID: <span className="font-mono text-white font-bold">{ord.trxId || "N/A"}</span></span>
                        <span className="font-black text-amber-400 text-sm">Total: ৳{ord.totalPrice}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white text-black rounded-2xl p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setActiveInvoice(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-black cursor-pointer">
              <X size={20} />
            </button>
            <div className="text-center border-b border-zinc-200 pb-3">
              <h2 className="font-black text-xl tracking-wider text-black">ONE SHOP INVOICE</h2>
              <p className="text-xs text-zinc-500">Official Cash Memo</p>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Customer:</strong> {activeInvoice.customerName}</p>
              <p><strong>Phone:</strong> {activeInvoice.phone}</p>
              <p><strong>Address:</strong> {activeInvoice.address}</p>
              <p><strong>Payment:</strong> {activeInvoice.paymentMethod} (TrxID: {activeInvoice.trxId})</p>
            </div>
            <div className="border-t border-b border-zinc-200 py-3 space-y-2 text-xs">
              <p className="font-bold text-zinc-800">Purchased Items:</p>
              {activeInvoice.items?.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.name} (x{it.quantity})</span>
                  <span>৳{it.price * it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-extrabold text-sm">
              <span>Total Paid:</span>
              <span className="text-amber-600">৳{activeInvoice.totalPrice}</span>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => { window.print(); }} 
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Print / Download PDF Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
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
                  <input 
                    type="text" 
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} 
                    required 
                    placeholder="email@example.com or +8801..." 
                    className="w-full border border-zinc-400 focus:border-amber-500 text-black px-3 py-2 rounded text-sm focus:outline-none"
                  />
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
                  Sign in with Google
                </button>
              </form>
            )}

            {authStep === 'password' && (
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-900">{isSignUp ? "Set your password" : "Enter password"}</h2>
                <p className="text-xs text-zinc-600">{identifier}</p>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-zinc-800">Password</label>
                    {!isSignUp && (
                      <button type="button" onClick={handleForgotPassword} className="text-[11px] text-amber-600 hover:underline font-semibold cursor-pointer">
                        Forgot Password?
                      </button>
                    )}
                  </div>
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

      {/* Floating Chatbot & WhatsApp Support */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="w-80 bg-zinc-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-96">
            <div className="bg-amber-500 text-black p-3 font-bold flex justify-between items-center text-xs">
              <span className="flex items-center gap-1"><MessageSquare size={16} /> One Shop Live Chat</span>
              <X size={18} className="cursor-pointer" onClick={() => setChatOpen(false)} />
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              {chatList.map((c, i) => (
                <div key={i} className={`p-2.5 rounded-xl max-w-[80%] ${c.sender === 'user' ? 'bg-amber-500 text-black ml-auto font-medium' : 'bg-zinc-900 text-white border border-zinc-800'}`}>
                  {c.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSend} className="p-2 border-t border-zinc-800 flex gap-2">
              <input 
                type="text" 
                value={chatMessage} 
                onChange={(e) => setChatMessage(e.target.value)} 
                placeholder="Type your question..." 
                className="flex-1 bg-black text-white text-xs px-3 py-2 rounded-xl border border-zinc-800 outline-none"
              />
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-2 rounded-xl text-xs">
                Send
              </button>
            </form>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setChatOpen(!chatOpen)}
            className="bg-amber-500 hover:bg-amber-600 text-black p-3.5 rounded-2xl shadow-2xl flex items-center justify-center font-bold transition cursor-pointer"
          >
            <MessageSquare size={20} />
          </button>
          <a 
            href={`https://wa.me/8801571282946?text=${customHelpLineMessage}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 font-black text-xs transition cursor-pointer"
          >
            <Phone size={16} /> WhatsApp Support
          </a>
        </div>
      </div>

    </div>
  );
}