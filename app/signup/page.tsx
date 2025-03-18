// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'developer' | 'evaluator'>('developer'); // Default role
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    // Sign up with Supabase
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    } 
    const userId = data.user?.id; //the user id from auth.user table

    if(userId) {
      //insert the user info (id, email, role) in users table
      console.log(role);
      const {error: insertError} = await supabase.from('users').insert([
        {
          id:userId,
          email:email,
          role: role //save role
        }
      ])

      if(insertError) {
        console.log("Error inserting into users table:" , insertError.message)
      }else {
        console.log("user added successfuly !");
      }
    }

   
    // Redirect to login page after successful sign-up
    router.push('/login');
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSignUp} className="w-80 space-y-4">
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
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}