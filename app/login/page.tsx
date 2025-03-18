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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="w-80 space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'developer' | 'evaluator')}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="developer">developer</option>
          <option value="evaluator">evaluator</option>
        </select>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}