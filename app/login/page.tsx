// app/login/page.tsx
'use client'; // Client Component

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'developer' | 'evaluator'>('developer'); // Default role
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission refresh
    setIsLoading(true); // Start loading

   

    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all fields.');
      setIsLoading(false); // Stop loading
      return;
    }

    // Sign in with Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password.');
      setIsLoading(false); // Stop loading
      return;
    }
    //id of the user 
    const userId = data.user?.id;

    //query to get the role of the user from "users" table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

      if(userError) {
        setError(userError.message);
      }

    //the user role
    const userRole = userData?.role;
    
    // Redirect based on role
    if(role === userRole) {
      if(role === 'developer')
        router.push("submit");
      else{
        router.push('/evaluate');
      }
    }
    else {
      setError("Invalid role");
      setIsLoading(false); // Stop loading
    }
    
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-96 p-8 bg-white/10 backdrop-blur-lg border border-gray-500 shadow-xl rounded-2xl">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Login</h1>
  
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <input
            type="email"
            placeholder="📧 Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-transparent border border-gray-400 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
          />
  
          {/* Password Input */}
          <input
            type="password"
            placeholder="🔑 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-transparent border border-gray-400 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
          />
  
          {/* Role Selection */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'developer' | 'evaluator')}
            className="w-full p-3 bg-transparent border border-gray-400 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="developer" className="bg-gray-800 text-white">👨‍💻 Developer</option>
            <option value="evaluator" className="bg-gray-800 text-white">🔍 Evaluator</option>
          </select>
  
          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-purple-500 text-white font-bold rounded-lg shadow-md hover:bg-purple-600 transition-transform transform hover:scale-105 disabled:bg-purple-300"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                Logging in...
                <div className="ml-2 w-4 h-4 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin"></div>
              </span>
            ) : (
              '🚀 Login'
            )}
          </button>
        </form>
  
        {/* Error Message */}
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
  
}