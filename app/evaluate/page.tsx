"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
const supabase = createClientComponentClient();

type Submission = {
  id: string;
  full_name: string;
  email: string;
  hobbies: string;
  profile_picture_url: string;
  source_code_url: string;
};

type Feedback = {
  id: string;
  submission_id: string;
  comments: string;
  decision: 'accepted' | 'rejected';
};

const EvaluatePage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [id, setID] = useState("");
  const [comments, setComments] = useState<{ [key: string]: string }>({}); // Track comments by submission ID
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({}); // Track loading state by submission ID
  const [error,setError] = useState(""); 
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
        if (data?.role !== "evaluator") {
          router.push("/unauthorized");
        } 
      } else {
        router.push("/login");
      }
    };
    fetchUserRole();
  }, [router]);

  // Fetch initial data
  useEffect(() => {
    fetchSubmissions();
    fetchFeedback();
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase.from("submissions").select("*");
    if (error) {
      console.error("Error fetching submissions:", error);
    } else {
      const submissionsWithUrls = data.map((submission) => ({
        ...submission,
        profile_picture_url: supabase.storage
          .from("profile-pictures")
          .getPublicUrl(submission.profile_picture_url).data.publicUrl,
      }));
      setSubmissions(submissionsWithUrls);
    }
  };

  const fetchFeedback = async () => {
    const { data, error } = await supabase.from('feedback').select('*');
    if (error) {
      console.error('Error fetching feedback:', error);
    } else {
      setFeedback(data);
    }
  };

  // Set up real-time updates for feedback
  useEffect(() => {
    const feedbackSubscription = supabase
      .channel('feedback-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        (payload) => {
          const newFeedback = payload.new as Feedback;
          if (payload.eventType === 'INSERT') {
            setFeedback((prev) => [...prev, newFeedback]);
          } else if (payload.eventType === 'UPDATE') {
            setFeedback((prev) =>
              prev.map((item) => (item.id === newFeedback.id ? newFeedback : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setFeedback((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      feedbackSubscription.unsubscribe();
    };
  }, []);

  // Handle feedback submission
  const handleFeedback = async (submissionId: string, decision: 'accepted' | 'rejected') => {
    // Set loading state for this submission
    setLoading((prev) => ({ ...prev, [submissionId]: true }));

    const comment = comments[submissionId] || ''; // Get the comment for this submission
    const { error } = await supabase
      .from('feedback')
      .insert([{ submission_id: submissionId, evaluator_id: id, decision, comments: comment }]);

    // Reset loading state for this submission
    setLoading((prev) => ({ ...prev, [submissionId]: false }));

    if (error) {
      console.error('Error submitting feedback:', error);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
    } else {
      // Clear the comment for this submission after submission
      setComments((prev) => ({ ...prev, [submissionId]: '' }));
    }
  };

  // Handle comment change for a specific submission
  const handleCommentChange = (submissionId: string, value: string) => {
    setComments((prev) => ({ ...prev, [submissionId]: value }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Evaluate Submissions</h1>

      {/* Grid Layout for Submissions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {submissions.map((submission) => (
          <div key={submission.id} className="p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-lg font-semibold mb-2">{submission.full_name}</h2>
            <p className="text-sm text-gray-600">Email: {submission.email}</p>
            <p className="text-sm text-gray-600">Hobbies: {submission.hobbies}</p>

            <img
              src={submission.profile_picture_url}
              alt="Profile"
              className="w-24 h-24 rounded-full mt-4 mb-4 mx-auto"
            />

            <a
              href={submission.source_code_url}
              download
              className="text-blue-500 underline text-sm"
            >
              Download Source Code
            </a>

            {/* Feedback Form */}
            <div className="mt-4">
              <h3 className="font-semibold text-md mb-2">Feedback</h3>
              <textarea
                onChange={(e) => handleCommentChange(submission.id, e.target.value)}
                value={comments[submission.id] || ''}
                placeholder="Enter your comments..."
                className="w-full p-2 border rounded-md text-sm mb-4"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleFeedback(submission.id, 'accepted')}
                  disabled={loading[submission.id]} // Disable the button while loading
                  className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors disabled:bg-green-300"
                >
                  {loading[submission.id] ? (
                    <div className="flex items-center gap-2">
                      <span>Submitting...</span>
                      {/* Add a spinner here (optional) */}
                      <div className="w-4 h-4 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    'Welcome to the Team'
                  )}
                </button>
                <button
                  onClick={() => handleFeedback(submission.id, 'rejected')}
                  disabled={loading[submission.id]} // Disable the button while loading
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 transition-colors disabled:bg-red-300"
                >
                  {loading[submission.id] ? (
                    <div className="flex items-center gap-2">
                      <span>Submitting...</span>
                      {/* Add a spinner here (optional) */}
                      <div className="w-4 h-4 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    'We Are Sorry'
                  )}
                </button>
              </div>
            </div>

            {/* Display Existing Feedback */}
            {feedback
              .filter((fb) => fb.submission_id === submission.id)
              .map((fb) => (
                <div key={fb.id} className="mt-2 p-2 bg-gray-100 rounded-md">
                  <p className="text-sm">Comments: {fb.comments}</p>
                  <p className="text-sm">Decision: {fb.decision}</p>
                </div>
              ))}
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
    </div>
  );
};

export default EvaluatePage;