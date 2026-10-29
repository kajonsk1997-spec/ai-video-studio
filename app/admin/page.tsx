"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Package, ShoppingBag, Flame, Plus, Trash2, Search, Eye, EyeOff, Key, CheckCircle2, ArrowLeft, ShieldCheck, UserCheck, UserX, Users, LogIn, LogOut, RefreshCcw, Download, Filter, Hash, UploadCloud, Clock
} from 'lucide-react';

// Firebase Import
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, setDoc, getDoc } from 'firebase/firestore';

const SUPER_ADMIN_EMAIL = "kajon.sk1997@gmail.com";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [adminAuthPass, setAdminAuthPass] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  
  const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'uploads' | 'banners' | 'approvals' | 'trash' | 'processing' | 'verified' | 'delivered' | 'cancelled'>('products');
  const [adminProductSearch, setAdminProductSearch] = useState('');
  
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [allOrdersList, setAllOrdersList] = useState<any[]>([]);
  const [adminBanners, setAdminBanners] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [trashItems, setTrashItems] = useState<any[]>([]);

  // Form States - New Product
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOldPrice, setProdOldPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('OTT');
  const [prodCustomId, setProdCustomId] = useState(''); 
  
  const [prodImageInputType, setProdImageInputType] = useState<'url' | 'file'>('url');
  const [prodImage, setProdImage] = useState('');
  const [prodVideoInputType, setProdVideoInputType] = useState<'url' | 'file'>('url');
  const [prodVideo, setProdVideo] = useState('');

  const [prodDesc, setProdDesc] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [newTitle1, setNewTitle1] = useState('');
  const [newTitle2, setNewTitle2] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCoupon, setNewCoupon] = useState('');
  
  const [bannerInputType, setBannerInputType] = useState<'url' | 'file'>('url');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState('image');
  const [newTargetCategory, setNewTargetCategory] = useState('OTT');
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const categoriesList = [
    "OTT", "Electronics", "Fashion", "Footwear", "Home & Living", 
    "Beauty & Personal Care", "Sports & Fitness", "Accessories", "Toys & Kids", "Health & Wellness", "Books & Stationery"
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = prodCategory ? prodCategory.slice(0, 3).toUpperCase() : "PRD";
    setProdCustomId(`${prefix}-${randomNum}`);
  }, [prodCategory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((reader.result as string) || '');
        showToast("File uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userEmail = currentUser.email?.toLowerCase();
        
        if (userEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
          setIsPendingApproval(false);
          await setDoc(doc(db, "admin_users", currentUser.uid), {
            email: currentUser.email,
            status: 'Approved',
            role: 'Super Admin',
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          const userDocRef = doc(db, "admin_users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists() && userDocSnap.data().status === 'Approved') {
            setIsPendingApproval(false);
          } else {
            setIsPendingApproval(true);
            await setDoc(userDocRef, {
              email: currentUser.email,
              status: userDocSnap.exists() ? userDocSnap.data().status : 'Pending',
              role: 'Editor Admin',
              createdAt: serverTimestamp()
            }, { merge: true });
          }
        }
      } else {
        setUser(null);
        setIsPendingApproval(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const qProd = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qOrd = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrd = onSnapshot(qOrd, (snapshot) => {
      setAllOrdersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qBan = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubBan = onSnapshot(qBan, (snapshot) => {
      setAdminBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(collection(db, "admin_users"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setAdminUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qTrash = query(collection(db, "trash_bin"), orderBy("deletedAt", "desc"));
    const unsubTrash = onSnapshot(qTrash, (snapshot) => {
      setTrashItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProd();
      unsubOrd();
      unsubBan();
      unsubUsers();
      unsubTrash();
    };
  }, []);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, emailInput, adminAuthPass);
      showToast("Signed in successfully!");
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        showToast("Incorrect Email or Password! Please check your credentials.");
      } else {
        showToast("Login Failed: " + error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast("Google Authentication Success!");
    } catch (error: any) {
      showToast("Google Sign-In Error: " + error.message);
    }
  };

  const handleApproveAdminUser = async (uid: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "admin_users", uid), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      showToast(`User status updated to: ${newStatus}`);
    } catch (error: any) {
      showToast("Approval error: " + error.message);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodImage) {
      showToast("Name, Price and Image are required!");
      return;
    }

    setIsAddingProduct(true);
    setUploadProgress(40);

    try {
      setUploadProgress(100);

      await addDoc(collection(db, "products"), {
        productId: prodCustomId,
        name: prodName,
        price: Number(prodPrice),
        originalPrice: prodOldPrice ? Number(prodOldPrice) : null,
        category: prodCategory,
        image: prodImage,
        video: prodVideo || null,
        description: prodDesc || "High quality product.",
        createdAt: serverTimestamp()
      });

      showToast("Product published live with ID: " + prodCustomId);

      setProdName('');
      setProdPrice('');
      setProdOldPrice('');
      setProdImage('');
      setProdVideo('');
      setProdDesc('');

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const prefix = prodCategory ? prodCategory.slice(0, 3).toUpperCase() : "PRD";
      setProdCustomId(`${prefix}-${randomNum}`);

      setIsAddingProduct(false);
      setUploadProgress(0);
      setAdminTab('uploads');

    } catch (error: any) {
      setIsAddingProduct(false);
      setUploadProgress(0);
      showToast("Error adding product: " + error.message);
    }
  };

  const handleMoveToTrash = async (item: any, type: string) => {
    if (!confirm(`Are you sure you want to move this ${type} to Trash Bin?`)) return;
    try {
      await addDoc(collection(db, "trash_bin"), {
        originalId: item.id,
        itemType: type,
        data: item,
        deletedAt: serverTimestamp()
      });

      if (type === 'product') {
        await deleteDoc(doc(db, "products", item.id));
      } else if (type === 'order') {
        await deleteDoc(doc(db, "orders", item.id));
      }

      showToast(`Moved to Trash Bin!`);
    } catch (error: any) {
      showToast("Error moving to trash: " + error.message);
    }
  };

  const handleRestoreFromTrash = async (trashDocId: string, itemData: any, itemType: string) => {
    try {
      if (itemType === 'product') {
        await addDoc(collection(db, "products"), {
          productId: itemData.productId || "PRD-1000",
          name: itemData.name,
          price: itemData.price,
          originalPrice: itemData.originalPrice || null,
          category: itemData.category,
          image: itemData.image,
          video: itemData.video || null,
          description: itemData.description || "",
          createdAt: serverTimestamp()
        });
      } else if (itemType === 'order') {
        await addDoc(collection(db, "orders"), {
          customerName: itemData.customerName,
          customerEmail: itemData.customerEmail,
          phone: itemData.phone,
          address: itemData.address,
          paymentMethod: itemData.paymentMethod,
          trxId: itemData.trxId,
          items: itemData.items,
          totalPrice: itemData.totalPrice,
          status: itemData.status,
          createdAt: serverTimestamp()
        });
      }

      await deleteDoc(doc(db, "trash_bin", trashDocId));
      showToast("Item restored successfully!");
    } catch (error: any) {
      showToast("Restore failed: " + error.message);
    }
  };

  const handlePermanentDelete = async (trashDocId: string) => {
    if (!confirm("Permanently delete this item from Bin?")) return;
    try {
      await deleteDoc(doc(db, "trash_bin", trashDocId));
      showToast("Permanently deleted!");
    } catch (error: any) {
      showToast("Error: " + error.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      showToast(`Order status updated to: ${newStatus}`);
    } catch (error: any) {
      showToast("Update failed: " + error.message);
    }
  };

  const handleAddBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl) {
      showToast("Please provide Media!");
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
      showToast("Banner removed!");
    } catch (error: any) {
      showToast("Error deleting banner: " + error.message);
    }
  };

  const handleExportOrdersCSV = () => {
    if (allOrdersList.length === 0) {
      showToast("No orders to export!");
      return;
    }
    const headers = "Customer Name,Phone,Email,Address,Payment Method,TrxID,Total Price,Status\n";
    const rows = allOrdersList.map(o => 
      `"${o.customerName || ''}","${o.phone || ''}","${o.customerEmail || o.email || ''}","${o.address || ''}","${o.paymentMethod || ''}","${o.trxId || ''}","${o.totalPrice || 0}","${o.status || 'Pending'}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `oneshop_orders_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Orders exported successfully!");
  };

  const filteredProducts = adminProductSearch.trim() === "" 
    ? products 
    : products.filter(p => 
        p.name?.toLowerCase().includes(adminProductSearch.toLowerCase()) || 
        p.category?.toLowerCase().includes(adminProductSearch.toLowerCase()) ||
        p.productId?.toLowerCase().includes(adminProductSearch.toLowerCase())
      );

  const filteredOrders = allOrdersList.filter(ord => {
    const q = orderSearchQuery.toLowerCase();
    const nameMatch = ord.customerName?.toLowerCase().includes(q) || false;
    const phoneMatch = ord.phone?.toLowerCase().includes(q) || false;
    const emailMatch = (ord.customerEmail || ord.email || '').toLowerCase().includes(q);
    const trxMatch = (ord.trxId || '').toLowerCase().includes(q);
    
    const matchesSearch = nameMatch || phoneMatch || emailMatch || trxMatch;
    
    if (orderStatusFilter === 'All') return matchesSearch;
    return matchesSearch && ((ord.status || 'Pending') === orderStatusFilter);
  });

  const processingOrders = allOrdersList.filter(o => (o.status || 'Pending') === 'Processing');
  const verifiedOrders = allOrdersList.filter(o => o.status === 'Verified');
  const deliveredOrders = allOrdersList.filter(o => o.status === 'Delivered');
  const cancelledOrders = allOrdersList.filter(o => o.status === 'Cancelled');

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans p-4 sm:p-8">
      
      {toastMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-zinc-900 border border-amber-500/50 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="text-amber-400" size={22} />
            <span className="text-sm font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-amber-400" size={28} />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">One Shop Admin Portal</h1>
            <p className="text-xs text-zinc-400">Multi-Product Upload & Control Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <button 
              onClick={() => signOut(auth)}
              className="bg-red-500/25 hover:bg-red-500 text-red-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={14} /> Logout ({user.email?.split('@')[0]})
            </button>
          )}
          <Link href="/" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-amber-400 px-3 py-2 rounded-xl flex items-center gap-1 font-bold transition">
            <ArrowLeft size={14} /> Back to Website
          </Link>
        </div>
      </div>

      {!user ? (
        /* LOGIN FORM */
        <div className="max-w-md mx-auto my-12 bg-zinc-950 border border-amber-500/40 p-8 rounded-2xl shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <Key size={30} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Admin Authentication</h2>
            <p className="text-xs text-zinc-400 mt-1">Sign in using Super Admin credentials or Google</p>
          </div>

          <form onSubmit={handleEmailPasswordLogin} className="space-y-3 text-left">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Admin Email</label>
              <input 
                type="email" 
                value={emailInput} 
                onChange={(e) => setEmailInput(e.target.value)} 
                placeholder="kajon.sk1997@gmail.com" 
                required
                className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-xs"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Admin Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={adminAuthPass} 
                  onChange={(e) => setAdminAuthPass(e.target.value)} 
                  placeholder="••••••••••••" 
                  required
                  className="w-full bg-black border border-zinc-700 text-white p-2.5 pr-10 rounded-xl outline-none text-xs"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-amber-400 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3 rounded-xl transition cursor-pointer text-sm shadow-lg shadow-amber-500/20">
              Sign In to Admin Panel
            </button>
          </form>

          <div className="flex items-center my-3">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="px-3 text-zinc-500 text-xs">or</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <LogIn size={16} className="text-amber-400" /> Sign In with Google
          </button>
        </div>
      ) : isPendingApproval ? (
        /* PENDING APPROVAL */
        <div className="max-w-md mx-auto my-16 bg-zinc-950 border border-amber-500/40 p-8 rounded-2xl shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400 animate-pulse">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Access Approval Pending</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Logged in as: <span className="text-amber-400 font-bold">{user.email}</span>.<br />
            Your admin request has been sent to Super Admin (<span className="text-white font-semibold">kajon.sk1997@gmail.com</span>). Once approved, you can access the dashboard.
          </p>
          <button onClick={() => window.location.reload()} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-amber-400 px-4 py-2 rounded-xl font-bold cursor-pointer">
            Check Approval Status
          </button>
        </div>
      ) : (
        /* DASHBOARD */
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
            <button 
              onClick={() => setAdminTab('products')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'products' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}
            >
              <Package size={14} /> Products ({products.length})
            </button>
            <button 
              onClick={() => setAdminTab('orders')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'orders' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}
            >
              <ShoppingBag size={14} /> All Orders ({allOrdersList.length})
            </button>
            
            <button 
              onClick={() => setAdminTab('uploads')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'uploads' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-900 text-amber-400 border border-amber-500/30 hover:bg-zinc-800'}`}
            >
              <UploadCloud size={14} /> Uploads Product ({products.length})
            </button>

            <button 
              onClick={() => setAdminTab('processing')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'processing' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-amber-400 border border-amber-500/30 hover:bg-zinc-800'}`}
            >
              Processing ({processingOrders.length})
            </button>
            <button 
              onClick={() => setAdminTab('verified')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'verified' ? 'bg-blue-500 text-white' : 'bg-zinc-900 text-blue-400 border border-blue-500/30 hover:bg-zinc-800'}`}
            >
              Received/Verified ({verifiedOrders.length})
            </button>
            <button 
              onClick={() => setAdminTab('delivered')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'delivered' ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-emerald-400 border border-emerald-500/30 hover:bg-zinc-800'}`}
            >
              Delivered ({deliveredOrders.length})
            </button>
            <button 
              onClick={() => setAdminTab('cancelled')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'cancelled' ? 'bg-red-500 text-white' : 'bg-zinc-900 text-red-400 border border-red-500/30 hover:bg-zinc-800'}`}
            >
              Cancel Orders ({cancelledOrders.length})
            </button>

            <button 
              onClick={() => setAdminTab('banners')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'banners' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}
            >
              <Flame size={14} /> Banners ({adminBanners.length})
            </button>

            <button 
              onClick={() => setAdminTab('trash')} 
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'trash' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-900 text-red-400 border border-red-500/30 hover:bg-zinc-800'}`}
            >
              <Trash2 size={14} /> Bin / Trash ({trashItems.length})
            </button>

            {user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
              <button 
                onClick={() => setAdminTab('approvals')} 
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${adminTab === 'approvals' ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-emerald-400 border border-emerald-500/30 hover:bg-zinc-800'}`}
              >
                <Users size={14} /> Approvals ({adminUsers.filter(u => u.status === 'Pending').length})
              </button>
            )}
          </div>

          {/* TAB 1: PRODUCT MANAGEMENT */}
          {adminTab === 'products' && (
            <div className="space-y-6 text-xs">
              <form onSubmit={handleAddProductSubmit} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-amber-400 text-sm flex items-center gap-1"><Plus size={16} /> Add New Product:</p>
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-xl font-mono font-bold text-xs flex items-center gap-1">
                    <Hash size={12} /> Auto ID: {prodCustomId}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Product Title *</label>
                    <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} required placeholder="e.g. Netflix Premium 1 Month" className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Price (৳) *</label>
                    <input type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required placeholder="350" className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Old Price (৳)</label>
                    <input type="number" value={prodOldPrice} onChange={(e) => setProdOldPrice(e.target.value)} placeholder="450" className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Category *</label>
                    <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none">
                      {categoriesList.map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Product Image Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-zinc-300 font-bold">Product Image *</label>
                      <span className="text-[10px] text-amber-400 cursor-pointer underline" onClick={() => setProdImageInputType(prodImageInputType === 'url' ? 'file' : 'url')}>
                        Switch to {prodImageInputType === 'url' ? 'File Upload' : 'URL Link'}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={prodImage} 
                      onChange={(e) => setProdImage(e.target.value)} 
                      required={prodImageInputType === 'url'} 
                      placeholder="https://image-url.jpg" 
                      className={`w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none ${prodImageInputType === 'file' ? 'hidden' : 'block'}`} 
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, setProdImage)} 
                      className={`w-full bg-black border border-zinc-700 text-white p-2 rounded-xl text-[10px] ${prodImageInputType === 'url' ? 'hidden' : 'block'}`} 
                    />
                  </div>

                  {/* Product Video Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-zinc-300 font-bold">Product Video (Optional)</label>
                      <span className="text-[10px] text-amber-400 cursor-pointer underline" onClick={() => setProdVideoInputType(prodVideoInputType === 'url' ? 'file' : 'url')}>
                        Switch to {prodVideoInputType === 'url' ? 'File Upload' : 'URL Link'}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={prodVideo} 
                      onChange={(e) => setProdVideo(e.target.value)} 
                      placeholder="https://video-url.mp4" 
                      className={`w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none ${prodVideoInputType === 'file' ? 'hidden' : 'block'}`} 
                    />
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={(e) => handleFileUpload(e, setProdVideo)} 
                      className={`w-full bg-black border border-zinc-700 text-white p-2 rounded-xl text-[10px] ${prodVideoInputType === 'url' ? 'hidden' : 'block'}`} 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Product Description</label>
                  <input type="text" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Describe product details..." className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                </div>

                {/* Compact Live Progress Bar */}
                {isAddingProduct && (
                  <div className="space-y-1 bg-black/50 p-2.5 rounded-xl border border-amber-500/20">
                    <div className="flex justify-between text-[11px] text-amber-400 font-bold">
                      <span>Publishing Product Live...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isAddingProduct} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3 rounded-xl transition cursor-pointer text-sm shadow-lg shadow-amber-500/20">
                  {isAddingProduct ? "Publishing Product..." : "Publish Product Live"}
                </button>
              </form>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="font-bold text-white text-sm">All Stored Products ({filteredProducts.length}):</span>
                  
                  <div className="relative w-full sm:w-72">
                    <input 
                      type="text" 
                      value={adminProductSearch} 
                      onChange={(e) => setAdminProductSearch(e.target.value)} 
                      placeholder="Search by ID, name, or category..." 
                      className="w-full bg-black border border-amber-500/40 text-white py-2 pl-3 pr-8 rounded-xl outline-none text-xs"
                    />
                    <Search size={14} className="absolute right-3 top-3 text-zinc-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="bg-black border border-zinc-800 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-xl border border-zinc-700" />
                        <div>
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded">
                            {p.productId || "PRD-ID"}
                          </span>
                          <p className="font-bold text-white line-clamp-1 mt-0.5">{p.name}</p>
                          <p className="text-[11px] text-amber-400 font-bold">৳{p.price} | {p.category}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleMoveToTrash(p, 'product')} 
                        className="bg-red-500/25 hover:bg-red-500 text-red-400 hover:text-white p-2.5 rounded-xl transition cursor-pointer"
                        title="Move to Trash Bin"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: UPLOADS PRODUCT */}
          {adminTab === 'uploads' && (
            <div className="space-y-4 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-2">
                    <UploadCloud size={18} /> Uploads Product & Live Catalog ({products.length} Products Available)
                  </h3>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Manage and view all successfully uploaded products instantly right here.</p>
                </div>
                <button 
                  onClick={() => setAdminTab('products')}
                  className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-xl font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  <Plus size={14} /> Add Another Product
                </button>
              </div>

              <div className="space-y-3">
                {products.length === 0 ? (
                  <p className="text-zinc-500 text-center py-12">No products uploaded yet.</p>
                ) : (
                  products.map((p, idx) => (
                    <div key={p.id || idx} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-xl border border-zinc-700" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded">
                              {p.productId || "PRD-ID"}
                            </span>
                            <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded font-bold">
                              {p.category}
                            </span>
                          </div>
                          <p className="font-bold text-white text-sm mt-1">{p.name}</p>
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Clock size={12} className="text-amber-400" /> Successfully uploaded live | Price: <span className="text-amber-400 font-bold">৳{p.price}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30">
                          Status: Live
                        </span>
                        <button 
                          onClick={() => handleMoveToTrash(p, 'product')} 
                          className="bg-red-500/25 hover:bg-red-500 text-red-400 hover:text-white p-2.5 rounded-xl transition cursor-pointer"
                          title="Move to Trash Bin"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ALL ORDERS */}
          {adminTab === 'orders' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-lg">
                <div className="flex items-center gap-2 flex-grow">
                  <div className="relative w-full sm:w-72">
                    <input 
                      type="text" 
                      value={orderSearchQuery} 
                      onChange={(e) => setOrderSearchQuery(e.target.value)} 
                      placeholder="Search by name, phone, email, trxID..." 
                      className="w-full bg-black border border-amber-500/40 text-white py-2 pl-3 pr-8 rounded-xl outline-none text-xs"
                    />
                    <Search size={14} className="absolute right-3 top-3 text-zinc-400" />
                  </div>

                  <div className="flex items-center gap-1 bg-black border border-zinc-700 px-3 py-2 rounded-xl text-zinc-300">
                    <Filter size={14} className="text-amber-400" />
                    <select 
                      value={orderStatusFilter} 
                      onChange={(e) => setOrderStatusFilter(e.target.value)} 
                      className="bg-transparent text-white outline-none cursor-pointer text-xs"
                    >
                      <option value="All" className="bg-zinc-900">All Status</option>
                      <option value="Processing" className="bg-zinc-900">Processing</option>
                      <option value="Verified" className="bg-zinc-900">Verified</option>
                      <option value="Delivered" className="bg-zinc-900">Delivered</option>
                      <option value="Cancelled" className="bg-zinc-900">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportOrdersCSV}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              <p className="font-bold text-zinc-300 text-sm">Showing Orders ({filteredOrders.length} of {allOrdersList.length}):</p>
              
              {filteredOrders.length === 0 ? (
                <p className="text-zinc-500 text-center py-12">No matching orders found.</p>
              ) : (
                filteredOrders.map((ord) => {
                  const currentStatus = ord.status || 'Pending';
                  
                  const phone = ord.phone || ord.whatsapp || ord.customerPhone || "";
                  const email = ord.customerEmail || ord.email || "N/A";
                  const password = ord.password || ord.customerPassword || "N/A";
                  const customerName = ord.customerName || "Valued Customer";
                  const totalAmount = ord.totalPrice || ord.totalPaid || 350;
                  const productTitle = ord.items?.[0]?.name || ord.items?.[0]?.title || "One Shop Item";
                  const orderDate = new Date().toLocaleDateString();
                  const renewalDate = "30 Days Later";

                  const waMessage = encodeURIComponent(
                    `Assalamu Alaikum.\n` +
                    `Your One Shop order has been updated.\n\n` +
                    `📦 Product: ${productTitle}\n` +
                    `👤 Gmail: ${email}\n` +
                    `🔑 Password: ${password}\n` +
                    `📅 Order Date: ${orderDate}\n` +
                    `🔄 Renewal Date: ${renewalDate}\n` +
                    `💰 Amount: ৳${totalAmount}\n` +
                    `📊 Status: ${currentStatus}\n\n` +
                    `Thank you for shopping with One Shop.`
                  );

                  return (
                    <div key={ord.id} className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                      <div className="flex flex-wrap justify-between items-center border-b border-zinc-800 pb-2 gap-2">
                        <div>
                          <span className="font-extrabold text-white text-sm">Customer: {customerName} ({phone})</span>
                          <p className="text-[10px] text-zinc-400">Payment: {ord.paymentMethod} | TrxID: <span className="text-amber-400 font-mono font-bold">{ord.trxId}</span></p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedInvoice(ord)}
                            className="bg-amber-500/25 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Eye size={14} /> View Memo
                          </button>
                          
                          {phone && (
                            <a
                              href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${waMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition shadow"
                            >
                              💬 WhatsApp Update
                            </a>
                          )}

                          <button 
                            onClick={() => handleMoveToTrash(ord, 'order')}
                            className="bg-red-500/25 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-xl transition"
                            title="Move Order to Bin"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                        <span className="text-zinc-400 font-bold mr-2">Status Actions:</span>
                        <button 
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Processing')}
                          className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${currentStatus === 'Processing' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}
                        >
                          Processing
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Verified')}
                          className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${currentStatus === 'Verified' ? 'bg-blue-500 text-white' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}
                        >
                          Received / Verified
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Delivered')}
                          className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${currentStatus === 'Delivered' ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-emerald-400 hover:bg-zinc-800'}`}
                        >
                          Delivered
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Cancelled')}
                          className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${currentStatus === 'Cancelled' ? 'bg-red-500 text-white' : 'bg-zinc-900 text-red-400 hover:bg-zinc-800'}`}
                        >
                          Cancel Order
                        </button>
                      </div>

                      <div className="space-y-1 bg-black p-3 rounded-xl border border-zinc-900">
                        <p className="font-bold text-zinc-400 text-[11px]">Items Purchased & Account Info:</p>
                        {ord.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-zinc-300">
                            <span>• {it.name} (x{it.quantity})</span>
                            <span className="font-bold text-amber-400">৳{it.price * it.quantity}</span>
                          </div>
                        ))}
                        <p className="text-[11px] text-zinc-400 pt-1">👤 Gmail: <span className="text-amber-400">{email}</span> | 🔑 Pass: <span className="text-amber-400">{password}</span></p>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Address: <span className="text-white">{ord.address}</span></span>
                        <span className="font-black text-amber-400 text-base">Total Paid: ৳{totalAmount}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: PROCESSING ORDERS */}
          {adminTab === 'processing' && (
            <div className="space-y-4 text-xs">
              <p className="font-bold text-amber-400 text-sm">Processing Orders ({processingOrders.length}):</p>
              {processingOrders.length === 0 ? (
                <p className="text-zinc-500 text-center py-12">No orders in Processing.</p>
              ) : (
                processingOrders.map((ord) => (
                  <div key={ord.id} className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="font-extrabold text-white text-sm">Customer: {ord.customerName} ({ord.phone})</span>
                      <button onClick={() => handleUpdateOrderStatus(ord.id, 'Delivered')} className="bg-emerald-500 text-black px-3 py-1 rounded-lg font-bold">Mark Delivered</button>
                    </div>
                    <p className="text-zinc-400">Total: ৳{ord.totalPrice} | TrxID: {ord.trxId}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: VERIFIED ORDERS */}
          {adminTab === 'verified' && (
            <div className="space-y-4 text-xs">
              <p className="font-bold text-blue-400 text-sm">Received / Verified Orders ({verifiedOrders.length}):</p>
              {verifiedOrders.length === 0 ? (
                <p className="text-zinc-500 text-center py-12">No verified orders.</p>
              ) : (
                verifiedOrders.map((ord) => (
                  <div key={ord.id} className="bg-zinc-950 border border-blue-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="font-extrabold text-white text-sm">Customer: {ord.customerName} ({ord.phone})</span>
                      <button onClick={() => handleUpdateOrderStatus(ord.id, 'Delivered')} className="bg-emerald-500 text-black px-3 py-1 rounded-lg font-bold">Mark Delivered</button>
                    </div>
                    <p className="text-zinc-400">Total: ৳{ord.totalPrice} | TrxID: {ord.trxId}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: DELIVERED ORDERS */}
          {adminTab === 'delivered' && (
            <div className="space-y-4 text-xs">
              <p className="font-bold text-emerald-400 text-sm">Delivered Orders ({deliveredOrders.length}):</p>
              {deliveredOrders.length === 0 ? (
                <p className="text-zinc-500 text-center py-12">No delivered orders yet.</p>
              ) : (
                deliveredOrders.map((ord) => (
                  <div key={ord.id} className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="font-extrabold text-white text-sm">Customer: {ord.customerName} ({ord.phone})</span>
                      <span className="bg-emerald-500/25 text-emerald-400 px-3 py-1 rounded font-bold">Completed</span>
                    </div>
                    <p className="text-zinc-400">Total: ৳{ord.totalPrice}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: CANCELLED ORDERS */}
          {adminTab === 'cancelled' && (
            <div className="space-y-4 text-xs">
              <p className="font-bold text-red-400 text-sm">Cancelled Orders ({cancelledOrders.length}):</p>
              {cancelledOrders.length === 0 ? (
                <p className="text-zinc-500 text-center py-12">No cancelled orders.</p>
              ) : (
                cancelledOrders.map((ord) => (
                  <div key={ord.id} className="bg-zinc-950 border border-red-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="font-extrabold text-white text-sm">Customer: {ord.customerName} ({ord.phone})</span>
                      <button onClick={() => handleMoveToTrash(ord, 'order')} className="bg-red-500/25 text-red-400 px-3 py-1 rounded font-bold">Move to Bin</button>
                    </div>
                    <p className="text-zinc-400">Total: ৳{ord.totalPrice}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: BANNERS & 5S VIDEO */}
          {adminTab === 'banners' && (
            <div className="space-y-6 text-xs">
              <form onSubmit={handleAddBannerSubmit} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
                <p className="font-bold text-amber-400 text-sm">Add New Hero Banner / 5s Video:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Title Line 1</label>
                    <input type="text" value={newTitle1} onChange={(e) => setNewTitle1(e.target.value)} placeholder="e.g. Elevate Your" className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Title Line 2 (Highlighted)</label>
                    <input type="text" value={newTitle2} onChange={(e) => setNewTitle2(e.target.value)} placeholder="e.g. Lifestyle" className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Media Type</label>
                    <select value={newMediaType} onChange={(e) => setNewMediaType(e.target.value)} className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none">
                      <option value="image">Image</option>
                      <option value="video">5s Video (MP4)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Target Category (Redirect)</label>
                    <input type="text" value={newTargetCategory} onChange={(e) => setNewTargetCategory(e.target.value)} placeholder="e.g. OTT or Electronics" className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-zinc-300 font-bold">Banner Media Source</label>
                      <span className="text-[10px] text-amber-400 cursor-pointer underline" onClick={() => setBannerInputType(bannerInputType === 'url' ? 'file' : 'url')}>
                        Switch to {bannerInputType === 'url' ? 'File Upload' : 'URL Link'}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={newMediaUrl} 
                      onChange={(e) => setNewMediaUrl(e.target.value)} 
                      required={bannerInputType === 'url'} 
                      placeholder="https://..." 
                      className={`w-full bg-black border border-zinc-700 text-white p-2.5 rounded-xl outline-none ${bannerInputType === 'file' ? 'hidden' : 'block'}`} 
                    />
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      onChange={(e) => handleFileUpload(e, setNewMediaUrl)} 
                      className={`w-full bg-black border border-zinc-700 text-white p-2 rounded-xl text-[10px] ${bannerInputType === 'url' ? 'hidden' : 'block'}`} 
                    />
                  </div>
                </div>

                <button type="submit" disabled={isAddingBanner} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3 rounded-xl transition cursor-pointer text-sm">
                  {isAddingBanner ? "Publishing Banner..." : "Add to Homepage Slider"}
                </button>
              </form>

              <div className="space-y-3">
                <p className="font-bold text-zinc-300 text-sm">Active Homepage Banners ({adminBanners.length}):</p>
                {adminBanners.map((banner, index) => (
                  <div key={banner.id || index} className="bg-black border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-700">
                        {banner.mediaType === 'video' ? (
                          <video src={banner.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={banner.mediaUrl} alt="Slide" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{banner.titleLine1} <span className="text-amber-400">{banner.titleLine2}</span></p>
                        <p className="text-xs text-zinc-400 mt-0.5">Redirect Target: <span className="text-amber-400 font-semibold">{banner.targetCategory}</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="bg-red-500/25 hover:bg-red-500 text-red-400 hover:text-white p-2.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRASH BIN TAB */}
          {adminTab === 'trash' && (
            <div className="space-y-4 text-xs">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-red-400 text-sm flex items-center gap-2">
                    <Trash2 size={18} /> Trash Bin & Recovery Hub
                  </h3>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Deleted products and orders are stored here. You can restore them anytime.</p>
                </div>
              </div>

              <div className="space-y-3">
                {trashItems.length === 0 ? (
                  <p className="text-zinc-500 text-center py-12">Trash bin is empty.</p>
                ) : (
                  trashItems.map((item) => (
                    <div key={item.id} className="bg-black border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                      <div>
                        <span className="text-[10px] bg-red-500/25 text-red-400 font-bold px-2 py-0.5 rounded uppercase">{item.itemType}</span>
                        <p className="font-bold text-white text-sm mt-1">{item.data?.name || item.data?.customerName || "Deleted Item"}</p>
                        <p className="text-[10px] text-zinc-400">Price / Total: ৳{item.data?.price || item.data?.totalPrice}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleRestoreFromTrash(item.id, item.data, item.itemType)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-black px-3 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <RefreshCcw size={14} /> Restore
                        </button>
                        <button 
                          onClick={() => handlePermanentDelete(item.id)}
                          className="bg-red-500/25 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 px-3 py-2 rounded-xl font-bold transition cursor-pointer"
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: APPROVALS */}
          {adminTab === 'approvals' && user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-emerald-400 text-sm flex items-center gap-2">
                    <ShieldCheck size={18} /> Admin Approval & Access Control Panel
                  </h3>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Manage users requesting Admin access to One Shop Dashboard.</p>
                </div>
              </div>

              <div className="space-y-3">
                {adminUsers.length === 0 ? (
                  <p className="text-zinc-500 text-center py-12">No admin requests yet.</p>
                ) : (
                  adminUsers.map((u) => {
                    const isApproved = u.status === 'Approved';
                    const isNotApproved = u.status === 'Not Approved' || u.status === 'Revoked';
                    return (
                      <div key={u.id} className="bg-black border border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isApproved ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/25 text-amber-400 border border-amber-500/40'}`}>
                            {u.email?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm break-all">{u.email}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              Role: <span className="text-amber-400 font-semibold">{u.role || 'Admin User'}</span> | Status: 
                              <span className={`font-bold ml-1 ${isApproved ? 'text-emerald-400' : isNotApproved ? 'text-red-400' : 'text-amber-400'}`}>{u.status || 'Pending'}</span>
                            </p>
                          </div>
                        </div>

                        {u.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase() && (
                          <div className="flex items-center gap-2 ml-auto">
                            {!isApproved ? (
                              <button 
                                onClick={() => handleApproveAdminUser(u.id, 'Approved')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer shrink-0"
                              >
                                <UserCheck size={14} /> Approve
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleApproveAdminUser(u.id, 'Revoked')}
                                className="bg-red-500/25 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                              >
                                <UserX size={14} /> Revoke
                              </button>
                            )}

                            {!isNotApproved && (
                              <button 
                                onClick={() => handleApproveAdminUser(u.id, 'Not Approved')}
                                className="bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                              >
                                <UserX size={14} /> Not Approved
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Invoice Modal for Admin */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white text-black rounded-2xl p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setSelectedInvoice(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-black cursor-pointer font-bold">
              ✕
            </button>
            <div className="text-center border-b border-zinc-200 pb-3">
              <h2 className="font-black text-xl tracking-wider text-black">ONE SHOP CASH MEMO</h2>
              <p className="text-xs text-zinc-500">Customer Order Receipt/Memo</p>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Customer:</strong> {selectedInvoice.customerName}</p>
              <p><strong>Phone:</strong> {selectedInvoice.phone}</p>
              <p><strong>Address:</strong> {selectedInvoice.address}</p>
              <p><strong>Payment Method:</strong> {selectedInvoice.paymentMethod} (TrxID: {selectedInvoice.trxId})</p>
            </div>
            <div className="border-t border-b border-zinc-200 py-3 space-y-2 text-xs">
              <p className="font-bold text-zinc-800">Purchased Items:</p>
              {selectedInvoice.items?.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.name} (x{it.quantity})</span>
                  <span>৳{it.price * it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-extrabold text-sm">
              <span>Total Paid Amount:</span>
              <span className="text-amber-600">৳{selectedInvoice.totalPrice}</span>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => { window.print(); }} 
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Print / Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}