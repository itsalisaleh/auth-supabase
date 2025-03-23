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

  const [feedback, setFeedback] = useState<{ comments: string; decision: string }[]>([]);


  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  

  useEffect(() => {
    const checkRoleAndFetchFeedbacl = async () => {
      
      
      
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
        const { data: submissionsData, error:submissionsError } = await supabase
        .from("feedback")
        .select("comments, decision, submissions!inner(user_id)")
        .eq("submissions.user_id", userId); // Filter submissions by user_id
          
          if(submissionsError) {
            setError(submissionsError.message)
            return;
          }
         
          setFeedback(submissionsData || [])
          

      } else {
        router.push("/login");
      }

    };
    
    checkRoleAndFetchFeedbacl();
    
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
        
      } catch (err) {
        if(err instanceof Error) {
          setError(err.message);
        }
        else {
          setError("failed to compress the image");
        }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-gray-500">
        
        <h2 className="text-4xl font-extrabold text-center mb-6 text-white">Submit Your Details</h2>
  
        {/* Display Error Message */}
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
  
        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Fields */}
          {[
            { id: "fullName", label: "Full Name", value: fullName, setter: setFullName, type: "text" },
            { id: "phoneNumber", label: "Phone Number", value: phoneNumber, setter: setPhoneNumber, type: "text" },
            { id: "location", label: "Location", value: location, setter: setLocation, type: "text" },
            { id: "email", label: "Email Address", value: email, setter: setEmail, type: "email" },
          ].map(({ id, label, value, setter, type }) => (
            <div key={id} className="relative">
              <input
                type={type}
                id={id}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full p-4 bg-transparent border border-gray-300 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-gray-400"
                placeholder={label}
                required
              />
            </div>
          ))}
  
          {/* Hobbies (Textarea) */}
          <div>
            <textarea
              id="hobbies"
              placeholder="Tell us about your hobbies..."
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              className="w-full p-4 bg-transparent border border-gray-300 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-gray-400 resize-none"
              required
            />
          </div>
  
          {/* File Upload Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center bg-gray-700/30 p-4 rounded-xl">
              <label className="text-white font-medium">Profile Picture</label>
              <input
                type="file"
                id="profilePic"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="mt-2 text-sm text-gray-300"
                required
              />
              {profilePicPreview && (
                <img src={profilePicPreview} alt="Profile Preview" className="w-24 h-24 rounded-full mt-3 shadow-lg" />
              )}
            </div>
  
            {/* Source Code Upload */}
            <div className="flex flex-col items-center bg-gray-700/30 p-4 rounded-xl">
              <label className="text-white font-medium">Upload Source Code</label>
              <input
                type="file"
                id="sourceCode"
                accept=".zip"
                onChange={handleSourceCodeChange}
                className="mt-2 text-sm text-gray-300"
                required
              />
            </div>
          </div>
  
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-purple-600 text-white font-bold text-lg rounded-xl shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block"></span>
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
  
        {/* Feedback Section */}
        <div className="mt-10 bg-gray-800/50 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold text-white border-b pb-2 mb-4">Evaluator Feedback</h2>
          {feedback?.length ? (
            <ul className="space-y-4">
              {feedback.map((item, index) => (
                <li key={index} className="p-4 bg-gray-700 rounded-lg shadow-md">
                  <p className="text-gray-300"><strong>Comment:</strong> {item.comments}</p>
                  <p className="text-gray-300"><strong>Decision:</strong> {item.decision}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center">No feedback available yet.</p>
          )}
        </div>
  
        {/* Error Message (Repeated for Visibility) */}
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
  
  
}
