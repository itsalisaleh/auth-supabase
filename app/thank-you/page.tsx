import React from 'react'

const page = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-lg text-center max-w-sm w-full">
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">Submission Completed</h2>
        <p className="text-lg text-gray-600 mb-6">Your submission has been successfully completed. Thank you for your effort!</p>
        <a
          href="/"
          className="inline-block py-2 px-6 bg-blue-600 text-white text-lg rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
  
}

export default page
    