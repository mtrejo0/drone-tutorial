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
  const lessonId = 3;
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
    
    for (let x = 50; x <= 400; x += 50) {
      p5.line(x, 20, x, 80);
      p5.textSize(10);
      p5.noStroke();
      p5.text((x - 50) / 50, x, 95);
    }
    
    // Draw goal
    p5.textSize(20);
    p5.text('⭐', 400, 55);
    
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
    const moveRightRegex = /^moveRight\(\s*(\d+)\s*\)\s*$/;
    const match = userCode.trim().match(moveRightRegex);
    
    if (!match) {
      setError('Use moveRight(units) to specify how far to move! Example: moveRight(7)');
      return;
    }

    const units = parseInt(match[1]);
    if (units !== 7) {
      setError('Not quite the right distance! Count the grid units to the star.');
    }
    
    // Create command with target position
    const newCommands = [{
      type: 'moveRight',
      targetX: 50 + (units * 50) // Each unit is 50 pixels
    }];
    
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
    if (Math.abs(robotPos - 400) < 5) {
      setHasWon(true);
      setError('');
    } else {
      setError('Not quite right! Try again.');
      setIsPlaying(false);
    }
  };

  const handleComplete = async () => {
    try {
      completeLesson(lessonId);
      setHasWon(false);
      router.push('/');
    } catch (error) {
      console.error('Error completing lesson:', error);
      setError('Failed to complete lesson. Please try again.');
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
          <h1 className="text-2xl font-bold mb-4">Move with Parameters! 🤖</h1>
          
          <p className="mb-4">
            Use <code>moveRight(units)</code> to move the robot a specific number of units to the right.
            Count the grid units and help the robot reach the star! Example: <code>moveRight(3)</code> moves 3 units right.
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