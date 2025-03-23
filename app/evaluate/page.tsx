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
  location: string;
  phone_number: string;
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
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null); // Track selected submission ID
  const [error, setError] = useState(""); 
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // To store the alert message
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

        if (error) {
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
        source_code_url: supabase.storage
          .from("source-code")
          .getPublicUrl(submission.source_code_url).data.publicUrl,
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

  const handleFeedback = async (submissionId: string, decision: 'accepted' | 'rejected') => {
    // Set loading state for this submission
    setLoading((prev) => ({ ...prev, [submissionId]: true }));
    setSelectedSubmissionId(submissionId); // Set selected submission to show notification

    const comment = comments[submissionId] || ''; // Get the comment for this submission
    const { error } = await supabase
      .from('feedback')
      .insert([{ submission_id: submissionId, evaluator_id: id, decision, comments: comment }]);

    // Reset loading state for this submission
    setLoading((prev) => ({ ...prev, [submissionId]: false }));

    if (error) {
      console.error('Error submitting feedback:', error);
      setAlertMessage('Failed to submit feedback.'); // Set error message for alert
      setTimeout(() => setAlertMessage(null), 5000); // Clear after 5 seconds
    } else {
      // Clear the comment for this submission after submission
      setComments((prev) => ({ ...prev, [submissionId]: '' }));

      // Get the submission email
      const submission = submissions.find((sub) => sub.id === submissionId);
      if (submission) {
        // Send an email to the submission's email address
        const emailMessage = `
          Your submission has been ${decision === 'accepted' ? 'accepted' : 'rejected'}.
          
          Feedback:
          ${comment}
        `;

        try {
          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: submission.email,
              subject: `Submission ${decision === 'accepted' ? 'Accepted' : 'Rejected'}`,
              message: emailMessage,
            }),
          });

          
          if (emailResponse.ok) {
            setAlertMessage(`Email sent successfully to ${submission.email}.`); // Success alert
            setTimeout(() => setAlertMessage(null), 5000); // Clear after 5 seconds
          } else {
            setAlertMessage('Failed to send email.');
            setTimeout(() => setAlertMessage(null), 5000); // Clear after 5 seconds
          }
        } catch (error) {
          setAlertMessage('Error sending email.');
          setTimeout(() => setAlertMessage(null), 5000); // Clear after 5 seconds
          console.error('Error sending email:', error);
        }
      }
    }
  };

  // Handle comment change for a specific submission
  const handleCommentChange = (submissionId: string, value: string) => {
    setComments((prev) => ({ ...prev, [submissionId]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <h1 className="text-4xl font-extrabold text-white mb-8">Evaluate Submissions</h1>

      

      {/* Grid Layout for Submissions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="w-72 p-4 bg-white/10 shadow-xl rounded-2xl border border-gray-500 transition-transform transform hover:scale-105"
          >
            <h2 className="text-2xl font-semibold text-white mb-2">{submission.full_name}</h2>
            <p className="text-sm text-gray-300">📧 {submission.email}</p>
            <p className="text-sm text-gray-300">🎨 {submission.hobbies}</p>
            <p className="text-sm text-gray-300">🌎 {submission.location}</p>
            <p className="text-sm text-gray-300">📞 {submission.phone_number}</p>

            {/* Profile Picture */}
            <img
              src={submission.profile_picture_url}
              alt="Profile"
              className="w-24 h-24 rounded-full mt-4 mb-4 mx-auto border-4 border-purple-500 shadow-lg"
            />

            {/* Download Source Code */}
            <a
              href={submission.source_code_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 font-semibold mt-2 inline-block transition-transform transform hover:scale-105 hover:text-purple-300"
            >
              ⬇️ Download Source Code
            </a>

            {/* Feedback Form */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Feedback</h3>
              <textarea
                onChange={(e) => handleCommentChange(submission.id, e.target.value)}
                value={comments[submission.id] || ''}
                placeholder="Share your feedback..."
                className="w-full p-3 bg-transparent border border-gray-400 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder-gray-400 resize-none"
                rows={3}
              />
              <div className="flex gap-3 mt-4">
                {/* Accept Button */}
                <button
                  onClick={() => handleFeedback(submission.id, 'accepted')}
                  disabled={loading[submission.id]}
                  className="flex-1 py-3 bg-green-500 text-white font-bold rounded-lg transition-transform transform hover:scale-105 disabled:bg-green-300"
                >
                  {loading[submission.id] ? (
                    <span className="animate-spin border-2 border-white border-t-2 border-t-transparent rounded-full w-5 h-5 inline-block"></span>
                  ) : (
                    '✅ Welcome to the Team'
                  )}
                </button>

                {/* Reject Button */}
                <button
                  onClick={() => handleFeedback(submission.id, 'rejected')}
                  disabled={loading[submission.id]}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-lg transition-transform transform hover:scale-105 disabled:bg-red-300"
                >
                  {loading[submission.id] ? (
                    <span className="animate-spin border-2 border-white border-t-2 border-t-transparent rounded-full w-5 h-5 inline-block"></span>
                  ) : (
                    '❌ We Are Sorry'
                  )}
                </button>
              </div>
            </div>

            {/* Display Existing Feedback */}
            {feedback
              .filter((fb) => fb.submission_id === submission.id)
              .map((fb) => (
                <div key={fb.id} className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-500">
                  <p className="text-gray-300"><strong>💬 Comments:</strong> {fb.comments}</p>
                  <p className="text-gray-300"><strong>📜 Decision:</strong> {fb.decision}</p>
                </div>
              ))}

            {/* Show Loading Spinner only for selected submission */}
            {selectedSubmissionId === submission.id && loading[submission.id] && (
              <div className="mt-4 text-center text-white">Processing...</div>
            )}
          </div>
        ))}
      </div>
      {/* Display alert message if present */}
      {alertMessage && (
        <div className="bg-green-500 text-white p-4 rounded-md mb-4 w-fit text-center">
          {alertMessage}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-400 text-center mt-6">{error}</p>}
    </div>
  );
};

export default EvaluatePage;
