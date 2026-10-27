"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter } from "next/navigation";


export default function LoginPage() {

  const router = useRouter();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [isRegister,setIsRegister] = useState(false);
  const [message,setMessage] = useState("");



  const handleEmailAuth = async()=>{

    try{

      if(isRegister){

        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        setMessage("Account Created Successfully!");

      }else{

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        setMessage("Login Successful!");

      }


      router.push("/order");


    }catch(error:any){

      setMessage(error.message);

    }

  };




  const handleGoogleLogin = async()=>{

    try{

      const provider = new GoogleAuthProvider();

      await signInWithPopup(
        auth,
        provider
      );


      router.push("/order");


    }catch(error:any){

      setMessage(error.message);

    }

  };





  const forgotPassword = async()=>{

    if(!email){

      setMessage("Enter your email first");
      return;

    }


    try{

      await sendPasswordResetEmail(
        auth,
        email
      );

      setMessage("Password reset link sent!");

    }catch(error:any){

      setMessage(error.message);

    }

  };





return (

<main className="min-h-screen bg-black text-white flex items-center justify-center">


<div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 w-96">


<h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">
ONE SHOP
</h1>


{message && (

<p className="text-green-400 text-center mb-4 text-sm">
{message}
</p>

)}



<input

type="email"

placeholder="Email"

className="w-full p-3 mb-3 bg-black border border-gray-600 rounded"

value={email}

onChange={(e)=>setEmail(e.target.value)}

/>



<input

type="password"

placeholder="Password"

className="w-full p-3 mb-4 bg-black border border-gray-600 rounded"

value={password}

onChange={(e)=>setPassword(e.target.value)}

/>



<button

onClick={handleEmailAuth}

className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold"

>

{isRegister ? "Create Account":"Login"}

</button>



<button

onClick={handleGoogleLogin}

className="w-full mt-4 bg-white text-black py-3 rounded-lg font-bold"

>

Sign in with Google

</button>



<button

onClick={forgotPassword}

className="text-yellow-400 mt-4 block mx-auto"

>

Forgot Password?

</button>



<button

onClick={()=>setIsRegister(!isRegister)}

className="text-gray-300 mt-3 block mx-auto"

>

{isRegister
?"Already have account? Login"
:"Create New Account"}

</button>


</div>


</main>

);


}