"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export default function SubmitPage() {
  
  const [id,setID] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [sourceCode, setSourceCode] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (userId) {
        setID(userId);
        
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();
          
        if(error) {
          setError(error.message);
        }
        if (data?.role !== "developer") {
          
          router.push("/unauthorized");
        } 
      } else {
        router.push("/login");
      }
    };
    fetchUserRole();
  }, [router]);

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1080 };
        const compressedFile = await imageCompression(file, options);
        setProfilePic(compressedFile);
        
        const objectUrl = URL.createObjectURL(compressedFile);
        setProfilePicPreview(objectUrl);
        
      } catch (error) {
        setError("Error compressing image.");
      }
    }
  };

  const handleSourceCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSourceCode(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber || !location || !email || !hobbies || !profilePic || !sourceCode) {
      setError("Please fill in all fields and upload your files.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: picData, error: picError } = await supabase.storage
        .from("profile-pictures")
        .upload(`profile-pic-${Date.now()}`, profilePic);
        
        
      if (picError) throw new Error(picError.message);
      

      const { data: codeData, error: codeError } = await supabase.storage
        .from("source-code")
        .upload(`source-code-${Date.now()}.zip`, sourceCode);
      if (codeError) throw new Error("codeError.message");
      
      await supabase.from("submissions").insert([
        { user_id: id, full_name: fullName, phone_number: phoneNumber, location, email, hobbies, profile_picture_url: picData?.path, source_code_url: codeData?.path }
      ]);
      alert("Submission successful!");
      router.push("/thank-you");
    } catch (err) {
      if(err instanceof Error){
        
        setError(err.message || "An unknown error occurred.");
      }else {
        setError("An unknown error occurred.");
      }
      
      
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-xl">
      <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">Developer Submission</h2>
      
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col">
          <label htmlFor="fullName" className="text-lg font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="fullName"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-2 p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="phoneNumber" className="text-lg font-medium text-gray-700">Phone Number</label>
          <input
            type="text"
            id="phoneNumber"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-2 p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="location" className="text-lg font-medium text-gray-700">Location</label>
          <input
            type="text"
            id="location"
            placeholder="Enter your location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-2 p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="email" className="text-lg font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="hobbies" className="text-lg font-medium text-gray-700">Hobbies</label>
          <textarea
            id="hobbies"
            placeholder="What do you like to do in life (other than coding)?"
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
            className="mt-2 p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="profilePic" className="text-lg font-medium text-gray-700">Profile Picture</label>
          <input
            type="file"
            id="profilePic"
            accept="image/*"
            onChange={handleProfilePicChange}
            className="mt-2 p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
          {profilePicPreview && (
            <div className="mt-4 flex justify-center">
              <img src={profilePicPreview} alt="Profile Preview" className="w-32 h-32 object-cover rounded-full border-4 border-blue-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label htmlFor="sourceCode" className="text-lg font-medium text-gray-700">Source Code</label>
          <input
            type="file"
            id="sourceCode"
            accept=".zip"
            onChange={handleSourceCodeChange}
            className="mt-2 p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg shadow-md transition duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            "Submit"
          )}
        </button>
      </form>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
    </div>
  );
}
