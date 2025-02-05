'use client'
import { useRouter } from 'next/navigation';
import { completeLesson, isLessonUnlocked } from '@/app/utils/lessonProgress';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
});

export default function MoveRobot2D() {
  const router = useRouter();
  const lessonId = 4;
  const [userCode, setUserCode] = useState('');
  const [error, setError] = useState('');
  const [robotPos, setRobotPos] = useState({ x: 50, y: 350 }); // Start at bottom left
  const [isPlaying, setIsPlaying] = useState(false);
  const [commands, setCommands] = useState([]);
  const [currentCommand, setCurrentCommand] = useState(0);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    if (!isLessonUnlocked(lessonId)) {
      router.push('/');
    }
  }, [router]);

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(500, 400).parent(canvasParentRef);
  };

  const draw = (p5) => {
    p5.background(240);
    
    // Draw grid
    p5.stroke(200);
    p5.strokeWeight(1);
    
    // Vertical lines
    for (let x = 50; x <= 400; x += 50) {
      p5.line(x, 50, x, 350);
      p5.textSize(10);
      p5.noStroke();
      p5.text((x - 50) / 50, x, 370);
    }
    
    // Horizontal lines
    for (let y = 50; y <= 350; y += 50) {
      p5.line(50, y, 400, y);
      p5.textSize(10);
      p5.noStroke();
      p5.text((350 - y) / 50, 30, y);
    }
    
    // Draw goal
    p5.textSize(20);
    p5.text('⭐', 200, 50); // Position at (3, 7) in grid coordinates
    
    // Draw robot
    p5.textSize(24);
    p5.text('🤖', robotPos.x, robotPos.y);

    // Animate robot movement
    if (isPlaying && commands.length > 0 && currentCommand < commands.length) {
      const cmd = commands[currentCommand];
      if (cmd.type === 'moveRight') {
        setRobotPos(prev => ({...prev, x: prev.x + 2}));
        if (robotPos.x >= cmd.targetX) {
          setCurrentCommand(prev => prev + 1);
        }
      } else if (cmd.type === 'moveUp') {
        setRobotPos(prev => ({...prev, y: prev.y - 2}));
        if (robotPos.y <= cmd.targetY) {
          setCurrentCommand(prev => prev + 1);
        }
      }
    } else if (isPlaying && currentCommand >= commands.length) {
      setIsPlaying(false);
      checkSolution();
    }
  };

  const handlePlay = () => {
    const moveRightMatch = userCode.match(/moveRight\(\s*(\d+)\s*\)/);
    const moveUpMatch = userCode.match(/moveUp\(\s*(\d+)\s*\)/);
    
    const newCommands = [];
    
    if (moveRightMatch) {
      const rightUnits = parseInt(moveRightMatch[1]);
      newCommands.push({
        type: 'moveRight',
        targetX: 50 + (rightUnits * 50)
      });
    }
    
    if (moveUpMatch) {
      const upUnits = parseInt(moveUpMatch[1]);
      newCommands.push({
        type: 'moveUp',
        targetY: 350 - (upUnits * 50)
      });
    }
    
    if (newCommands.length === 0) {
      setError('Use moveRight(units) or moveUp(units) to reach the star! Example: moveRight(3) or moveUp(7)');
      return;
    }
    
    setCommands(newCommands);
    setCurrentCommand(0);
    setIsPlaying(true);
    setError('');
  };

  const handleReset = () => {
    setRobotPos({ x: 50, y: 350 });
    setIsPlaying(false);
    setCurrentCommand(0);
    setCommands([]);
    setError('');
  };

  const checkSolution = () => {
    if (Math.abs(robotPos.x - 200) < 5 && Math.abs(robotPos.y - 50) < 5) {
      setHasWon(true);
      setError('');
    } else {
      setError('Not quite right! Try again.');
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
          <h1 className="text-2xl font-bold mb-4">2D Movement! 🤖</h1>
          
          <p className="mb-4">
            Now you can move in two dimensions! Use <code>moveRight(units)</code> and <code>moveUp(units)</code> to reach the star.
            Count the grid units carefully in both directions. Example: <code>moveRight(3) moveUp(2)</code>
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