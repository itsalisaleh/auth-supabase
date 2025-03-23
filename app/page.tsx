"use client"
import Link from 'next/link';


export default function Home() {
    
  return (
    <div className="p-6 bg-gradient-to-r from-gray-800 to-black min-h-screen flex items-center justify-center">
      <div className="text-center p-8 bg-gray-900 bg-opacity-70 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to My Website</h1>
        <p className="text-lg text-gray-300 mb-6">This project is developed by Ali Saleh for MoonDev.Solutions</p>
        <Link href="/login">
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors w-full">
            Go to Login Page
          </button>
        </Link>
      </div>
    </div>
  );
  
  
  
  
  }
  