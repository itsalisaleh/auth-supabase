"use client";
import { useRouter } from "next/navigation";
import React from 'react';

const Unauthorized = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/login");
  };

  return (
    <div className="p-4">
      <h1>You can't access this page!</h1>
      <button onClick={handleClick} className="bg-blue-500 cursor-pointer text-white px-4 py-2">
        Return to login page
      </button>
    </div>
  );
};

export default Unauthorized;