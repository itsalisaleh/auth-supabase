"use client";
import { useRouter } from "next/navigation";
import React from 'react';

const Unauthorized = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 to-gray-800 p-6">
      <div className="text-center p-8 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6">You can't access this page!</h1>
        <button
          onClick={handleClick}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow-md hover:bg-blue-600 transition duration-300"
        >
          Return to Login Page
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;