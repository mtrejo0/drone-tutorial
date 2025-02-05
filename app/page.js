'use client'
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { getCookie, setCookie } from 'cookies-next';

const lessons = [
  {
    id: 1,
    title: "Introduction to Basics",
    description: "Learn the fundamental concepts",
    route: "/lessons/introduction"
  },
  {
    id: 2,
    title: "Move Robot",
    description: "Call a function!",
    route: "/lessons/2MoveRobot"
  },
  {
    id: 3,
    title: "Move Robot - Parameters!",
    description: "Call a function with parameters!",
    route: "/lessons/3MoveRobot"
  },
  {
    id: 4,
    title: "Move Robot - 2D",
    description: "Call a function with parameters!",
    route: "/lessons/4MoveRobot2D"
  },
];



export default function Home() {
  const router = useRouter();
  const [unlockedLessons, setUnlockedLessons] = useState([1]);

  

  useEffect(() => {
    const savedProgress = getCookie('lessonProgress');
    if (savedProgress) {
      setUnlockedLessons(JSON.parse(savedProgress));
    }
  }, []);

  const handleLessonClick = (lesson) => {
    if (unlockedLessons.includes(lesson.id)) {
      router.push(lesson.route);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Educational Journey</h1>
        <div className="grid gap-4">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`p-4 rounded-lg border ${
                unlockedLessons.includes(lesson.id)
                  ? 'bg-white cursor-pointer hover:shadow-md'
                  : 'bg-gray-100 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => handleLessonClick(lesson)}
            >
              <h2 className="text-xl font-semibold">
                Lesson {lesson.id}: {lesson.title}
              </h2>
              <p className="text-gray-600">{lesson.description}</p>
              {!unlockedLessons.includes(lesson.id) && (
                <span className="text-sm text-red-500">🔒 Locked</span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
