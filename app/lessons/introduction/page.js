'use client'
import { useRouter } from 'next/navigation';
import { completeLesson, isLessonUnlocked } from '@/app/utils/lessonProgress';
import { useEffect, useState } from 'react';

export default function IntroductionLesson() {
  const router = useRouter();
  const lessonId = 1;
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if lesson is locked
    if (!isLessonUnlocked(lessonId)) {
      router.push('/');
    }
  }, [router]);

  const handleComplete = () => {
    if (userInput.toLowerCase() === 'done') {
      completeLesson(lessonId);
      router.push('/');
    } else {
      setError('Please type "done" to complete the lesson');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-4 text-blue-500 hover:underline"
        >
          ← Back to lessons
        </button>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Introduction to Basics</h1>
          
          <div className="prose max-w-none mb-6">
            <p>Welcome to your first lesson! This is a simple introduction to show you how our lessons work.</p>
            <p className="mt-4">To complete this lesson and unlock the next one, simply type the word "done" in the box below.</p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type 'done' here"
              className="border p-2 rounded w-full max-w-xs"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          {userInput.toLowerCase() === 'done' && (
            <button
              onClick={handleComplete}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Complete Lesson
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 