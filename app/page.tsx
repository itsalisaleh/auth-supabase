"use client"
import Link from 'next/link';


export default function Home() {
    
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-gray-700 to-blue-800 text-white">
        <div className="text-center p-6 bg-white bg-opacity-20 backdrop-blur-md rounded-2xl shadow-lg">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-blue-400">Welcome to My Website</h1>
          <p className="text-lg md:text-xl text-gray-500">This project is developed by ali saleh for MoonDev.Solutions</p>
          <Link href="/login">
          <button className="px-6 py-3 bg-white text-gray-500 font-semibold rounded-xl shadow-md hover:bg-gray-200 transition">Go to login Page</button>
        </Link>
        </div>
      </div>
    );
  }
  