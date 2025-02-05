import { getCookie, setCookie } from 'cookies-next';

export const completeLesson = (lessonId) => {
  const savedProgress = getCookie('lessonProgress');
  let unlockedLessons = savedProgress ? JSON.parse(savedProgress) : [1];
  
  if (lessonId < 10 && !unlockedLessons.includes(lessonId + 1)) {
    unlockedLessons.push(lessonId + 1);
    setCookie('lessonProgress', JSON.stringify(unlockedLessons));
  }
  
  return unlockedLessons;
};

export const isLessonUnlocked = (lessonId) => {
  const savedProgress = getCookie('lessonProgress');
  const unlockedLessons = savedProgress ? JSON.parse(savedProgress) : [1];
  return unlockedLessons.includes(lessonId);
};

export const initializeLessonProgress = () => {
  const savedProgress = getCookie('lessonProgress');
  if (!savedProgress) {
    setCookie('lessonProgress', JSON.stringify([1]));
  }
  return savedProgress ? JSON.parse(savedProgress) : [1];
};