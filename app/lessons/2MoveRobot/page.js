'use client'
import { useRouter } from 'next/navigation';
import { completeLesson, isLessonUnlocked } from '@/app/utils/lessonProgress';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import p5 with no SSR
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
});

export default function MoveRobot() {
  const router = useRouter();
  const lessonId = 2;
  const [userCode, setUserCode] = useState('');
  const [error, setError] = useState('');
  const [robotPos, setRobotPos] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [commands, setCommands] = useState([]);
  const [currentCommand, setCurrentCommand] = useState(0);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    // Redirect if lesson is locked
    if (!isLessonUnlocked(lessonId)) {
      router.push('/');
    }
  }, [router]);

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(500, 100).parent(canvasParentRef);
  };

  const draw = (p5) => {
    p5.background(240);
    
    // Draw goal
    p5.textSize(20);
    p5.text('⭐', 250, 55);
    
    // Draw robot
    p5.textSize(24);
    p5.text('🤖', robotPos, 55);

    // Animate robot movement
    if (isPlaying && commands.length > 0 && currentCommand < commands.length) {
      const cmd = commands[currentCommand];
      if (cmd.type === 'moveRight') {
        setRobotPos(prev => prev + 2);
        if (robotPos >= cmd.targetX) {
          setCurrentCommand(prev => prev + 1);
        }
      }
    } else if (isPlaying && currentCommand >= commands.length) {
      setIsPlaying(false);
      checkSolution();
    }
  };

  const handlePlay = () => {
    const moveRightRegex = /^(moveRight\(\)\s*)+$/;
    if (!moveRightRegex.test(userCode.trim())) {
      setError('Use moveRight() commands to reach the star!');
      return;
    }
    
    // Count the number of moveRight() commands
    const commandCount = (userCode.match(/moveRight\(\)/g) || []).length;
    
    // Create commands with incrementing target positions
    const newCommands = Array(commandCount).fill(null).map((_, index) => ({
      type: 'moveRight',
      targetX: robotPos + (40 * (index + 1)) // Each command moves 40 pixels further
    }));
    
    setCommands(newCommands);
    setCurrentCommand(0);
    setIsPlaying(true);
    setError('');
  };

  const handleReset = () => {
    setRobotPos(50);
    setIsPlaying(false);
    setCurrentCommand(0);
    setCommands([]);
    setError('');
  };

  const checkSolution = () => {
    if (Math.abs(robotPos - 250) < 5) {
      setHasWon(true);
      setError('');
    } else {
      setError('Not quite right! Try again.');
      setIsPlaying(false);
    }
  };

  const handleComplete = () => {
    completeLesson(lessonId);
    router.push('/');
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
          <h1 className="text-2xl font-bold mb-4">Help the Robot! 🤖</h1>
          
          <p className="mb-4">
            Use multiple <code>moveRight()</code> commands to help the robot reach the star!
          </p>

          <div className="mb-4">
            <Sketch setup={setup} draw={draw} />
          </div>

          <div className="mb-4">
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="Enter your code here..."
              className="border p-2 rounded w-full h-32 font-mono"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePlay}
              disabled={isPlaying || error}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Run Code
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Reset
            </button>
            {hasWon && (
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
    </div>
  );
} 