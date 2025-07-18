import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Star, Trophy, Target, Share2, Calendar } from 'lucide-react';

const HindiEnglishQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [gameState, setGameState] = useState('menu'); // menu, playing, results
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isCorrect, setIsCorrect] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [lives, setLives] = useState(3);
  const [powerUps, setPowerUps] = useState({ skipQuestion: 2, extraTime: 2, fiftyFifty: 2 });
  const [showPowerUpEffect, setShowPowerUpEffect] = useState('');
  
  // Text-to-Speech states
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // New states for the requested features
  const [quizUpdateDate, setQuizUpdateDate] = useState(null);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  
  // Track if this is a student-specific quiz link
  const [isStudentQuiz, setIsStudentQuiz] = useState(false);
  // Track if we're in student quiz mode (after entering student name)
  const [studentQuizMode, setStudentQuizMode] = useState(false);
  
  // Analytics tracking for AI-driven learning
  const [userPerformance, setUserPerformance] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    questionHistory: [], // Track each question and user's answer
    weakAreas: {}, // Track which idioms/phrases user struggles with
    strongAreas: {}, // Track which idioms/phrases user excels at
    difficultyProgression: [], // Track difficulty changes
    currentDifficulty: 'easy', // Current difficulty level
    difficultyStats: {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    },
    sessionStats: {
      currentSession: 0,
      totalSessions: 0,
      averageAccuracy: 0,
      bestStreak: 0
    }
  });
  
  const timerRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  const utteranceRef = useRef(null);

  // Add error state for question loading
  const [questionLoadError, setQuestionLoadError] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [currentOptions, setCurrentOptions] = useState([]);

  // Load highest scores and user performance from localStorage on component mount
  useEffect(() => {
    const savedHighestScore = localStorage.getItem('highestScore');
    const savedHighestStreak = localStorage.getItem('highestStreak');
    const savedUserPerformance = localStorage.getItem('userPerformance');
    
    if (savedHighestScore) setHighestScore(parseInt(savedHighestScore));
    if (savedHighestStreak) setHighestStreak(parseInt(savedHighestStreak));
    if (savedUserPerformance) {
      try {
        setUserPerformance(JSON.parse(savedUserPerformance));
      } catch (e) {
        console.error('Error parsing saved user performance:', e);
      }
    }
  }, []);

  // Simplify question loading - always load 30 questions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const student = urlParams.get('student');
    
    // Check if we should auto-detect student based on name
    let detectedStudent = null;
    if (playerName) {
      const nameLower = playerName.toLowerCase().trim();
      if (nameLower === 'anaya') {
        detectedStudent = '1';
      } else if (nameLower === 'kavya') {
        detectedStudent = '2';
      } else if (nameLower === 'mamta') {
        detectedStudent = '3';
      }
    }
    
    // Use detected student or URL parameter
    const finalStudent = detectedStudent || student;
    
    if (finalStudent) {
      setIsStudentQuiz(true);
      setStudentQuizMode(true);
      
      // Update URL if we detected a student by name
      if (detectedStudent && !student) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('student', detectedStudent);
        window.history.replaceState({}, '', newUrl);
      }
    }
    
    const questionFile = finalStudent ? `questions-student${finalStudent}.json` : 'questions.json';
    
    // Add a flag to prevent multiple simultaneous requests
    let isMounted = true;
    
    fetch(questionFile)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const lastModified = response.headers.get('last-modified');
        if (lastModified) {
          setQuizUpdateDate(new Date(lastModified));
        }
        return response.json();
      })
      .then(data => {
        if (!isMounted) return;
        
        // Always process and shuffle 30 questions
        const processedQuestions = data.map((question, index) => ({
          ...question,
          id: question.id || index,
        }));
        const shuffledQuestions = [...processedQuestions].sort(() => Math.random() - 0.5).slice(0, 30);
        setQuestions(shuffledQuestions);
        setQuestionLoadError(null);
      })
      .catch(error => {
        if (!isMounted) return;
        console.error('Error loading questions:', error);
        setQuestionLoadError('Could not load quiz questions. Please check your link or try again later.');
        setQuestions([]);
      });
      
    return () => {
      isMounted = false;
    };
  }, [playerName]); // Add playerName as dependency to re-run when name changes

  // Fix options useEffect to only shuffle when currentQuestion changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestion < questions.length) {
      const options = [...questions[currentQuestion].options];
      setCurrentOptions(options.sort(() => Math.random() - 0.5));
    }
  }, [questions, currentQuestion]); // Depend on questions and currentQuestion

  // Update speak function to accept rate and auto-select voice - wrapped in useCallback
  const speak = useCallback((text, customRate = 1) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(text);
      const selectedVoice = getVoiceForText(text, voices);
      utter.voice = selectedVoice;
      utter.pitch = 1;
      utter.rate = customRate;
      utter.volume = 1;
      utter.lang = selectedVoice?.lang || 'en-US';
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onpause = () => setIsPaused(true);
      utter.onresume = () => setIsPaused(false);
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    }
  }, [voices]);

  // Auto-speak when question changes - use ref to avoid infinite loops
  const speakRef = useRef(speak);
  speakRef.current = speak;

  // Fix speak useEffect to only speak when currentQuestion changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestion < questions.length && gameState === 'playing') {
      speakRef.current(questions[currentQuestion].question, 1);
    }
  }, [currentQuestion, gameState]); // Only depend on currentQuestion and gameState

  // Sound effects - wrapped in useCallback to prevent infinite loops
  const playSound = useCallback((type) => {
    if (!sfxEnabled) return;
    // Sound effect logic here
    console.log(`Playing ${type} sound`);
  }, [sfxEnabled]);

  // Move handleTimeUp here, before useEffect - wrapped in useCallback
  const handleTimeUp = useCallback(() => {
    setShowResult(true);
    setIsCorrect(false);
    setStreak(0);
    setLives(prev => prev - 1);
    playSound('wrong');
    // Track timeout as incorrect answer for analytics
    const currentQ = questions[currentQuestion];
    if (currentQ) {
      const questionKey = currentQ.question;
      setUserPerformance(prev => {
        const newHistory = [...prev.questionHistory, {
          question: currentQ.question,
          userAnswer: null,
          correctAnswer: currentQ.correct,
          isCorrect: false,
          difficulty: currentQ.difficulty || 'easy',
          masteryLevel: currentQ.masteryLevel || 0,
          timestamp: new Date().toISOString(),
          timeLeft: 0,
          streak: 0
        }];
        const newWeakAreas = { ...prev.weakAreas };
        newWeakAreas[questionKey] = (newWeakAreas[questionKey] || 0) + 1;
        return {
          ...prev,
          totalQuestions: prev.totalQuestions + 1,
          incorrectAnswers: prev.incorrectAnswers + 1,
          questionHistory: newHistory,
          weakAreas: newWeakAreas
        };
      });
    }
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length && lives > 1) {
        // Use functional update to avoid dependency on nextQuestion
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(60);
        setShowResult(false);
        setSelectedAnswer('');
      } else {
        // Use functional update to avoid dependency on endGame
        setGameState('results');
        setShowResult(false);
        setSelectedAnswer('');
      }
    }, 2000);
  }, [currentQuestion, questions, lives, playSound]);

  // Timer effect - use ref to avoid infinite loops
  const handleTimeUpRef = useRef(handleTimeUp);
  handleTimeUpRef.current = handleTimeUp;

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !showResult) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUpRef.current();
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, gameState, showResult]);

  // Simplify handleAnswerSelect - remove isProcessingAnswer logic
  const handleAnswerSelect = (option) => {
    if (showResult) return; // Prevent multiple answers
    
    const currentQ = questions[currentQuestion];
    if (!currentQ) return;
    
    setSelectedAnswer(option);
    setShowResult(true);
    
    const isCorrectAnswer = option === currentQ?.correct;
    const timeBonus = Math.max(0, timeLeft - 5) * 2; // Bonus points for quick answers
    const streakBonus = streak > 0 ? streak * 5 : 0;
    
    setIsCorrect(isCorrectAnswer);
    
    if (isCorrectAnswer) {
      // Correct answer logic
      const pointsEarned = 100 + timeBonus + streakBonus;
      setScore(score + pointsEarned);
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
      playSound('correct');
      
      // Update mastery level for this question
      const newMasteryLevel = Math.min(5, (currentQ.masteryLevel || 0) + 1);
      setQuestions(prev => prev.map(q => 
        q.id === currentQ.id ? { ...q, masteryLevel: newMasteryLevel } : q
      ));
      
      // Update user performance analytics
      setUserPerformance(prev => {
        const newHistory = [...prev.questionHistory, {
          question: currentQ.question,
          userAnswer: option,
          correctAnswer: currentQ.correct,
          isCorrect: true,
          difficulty: currentQ.difficulty || 'easy',
          masteryLevel: newMasteryLevel,
          timestamp: new Date().toISOString(),
          timeLeft,
          streak: streak + 1,
          pointsEarned
        }];
        
        const newStrongAreas = { ...prev.strongAreas };
        newStrongAreas[currentQ.question] = (newStrongAreas[currentQ.question] || 0) + 1;
        
        const newDifficultyStats = { ...prev.difficultyStats };
        const difficulty = currentQ.difficulty || 'easy';
        const newTotal = (newDifficultyStats[difficulty]?.total ?? 0) + 1;
        newDifficultyStats[difficulty] = {
          total: newTotal,
          correct: (newDifficultyStats[difficulty]?.correct ?? 0) + 1
        };
        
        return {
          ...prev,
          totalQuestions: prev.totalQuestions + 1,
          correctAnswers: prev.correctAnswers + 1,
          questionHistory: newHistory,
          strongAreas: newStrongAreas,
          difficultyStats: newDifficultyStats
        };
      });
      
      // Update highest score and streak if needed
      if (score + pointsEarned > highestScore) {
        setHighestScore(score + pointsEarned);
        localStorage.setItem('highestScore', score + pointsEarned);
      }
      if (streak + 1 > highestStreak) {
        setHighestStreak(streak + 1);
        localStorage.setItem('highestStreak', streak + 1);
      }
      
    } else {
      // Incorrect answer logic
      setLives(lives - 1);
      setStreak(0);
      playSound('wrong');
      
      // Decrease mastery level for this question
      const newMasteryLevel = Math.max(0, (currentQ.masteryLevel || 0) - 1);
      setQuestions(prev => prev.map(q => 
        q.id === currentQ.id ? { ...q, masteryLevel: newMasteryLevel } : q
      ));
      
      // Update user performance analytics
      setUserPerformance(prev => {
        const newHistory = [...prev.questionHistory, {
          question: currentQ.question,
          userAnswer: option,
          correctAnswer: currentQ.correct,
          isCorrect: false,
          difficulty: currentQ.difficulty || 'easy',
          masteryLevel: newMasteryLevel,
          timestamp: new Date().toISOString(),
          timeLeft,
          streak: 0
        }];
        
        const newWeakAreas = { ...prev.weakAreas };
        newWeakAreas[currentQ.question] = (newWeakAreas[currentQ.question] || 0) + 1;
        
        const newDifficultyStats = { ...prev.difficultyStats };
        const difficulty = currentQ.difficulty || 'easy';
        const newTotal = (newDifficultyStats[difficulty]?.total ?? 0) + 1;
        newDifficultyStats[difficulty] = {
          total: newTotal,
          correct: (newDifficultyStats[difficulty]?.correct ?? 0)
        };
        
        return {
          ...prev,
          totalQuestions: prev.totalQuestions + 1,
          incorrectAnswers: prev.incorrectAnswers + 1,
          questionHistory: newHistory,
          weakAreas: newWeakAreas,
          difficultyStats: newDifficultyStats
        };
      });
    }
    
    // Schedule next question or end game
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length && lives > (isCorrectAnswer ? 0 : 1)) {
        nextQuestion();
      } else {
        endGame();
      }
    }, 2000);
  };

  // Simplify nextQuestion function - just increment
  const nextQuestion = () => {
    setCurrentQuestion(currentQuestion + 1);
    setSelectedAnswer('');
    setShowResult(false);
    setTimeLeft(60);
  };

  // Generate performance insights and recommendations
  const generateInsights = () => {
    const { difficultyStats, questionHistory } = userPerformance;
    
    const insights = [];
    const recommendations = [];
    
    // Analyze difficulty performance
    const easyAccuracy = (difficultyStats.easy?.total > 0) ? (difficultyStats.easy?.correct / difficultyStats.easy.total) : 0;
    const mediumAccuracy = (difficultyStats.medium?.total > 0) ? (difficultyStats.medium?.correct / difficultyStats.medium.total) : 0;
    const hardAccuracy = (difficultyStats.hard?.total > 0) ? (difficultyStats.hard?.correct / difficultyStats.hard.total) : 0;
    
    // Difficulty insights
    if (easyAccuracy >= 0.8 && (difficultyStats.easy?.total ?? 0) >= 5) {
      insights.push("🎯 You're excelling at easy questions!");
      recommendations.push("Try more medium difficulty questions to challenge yourself.");
    }
    
    if (mediumAccuracy >= 0.7 && (difficultyStats.medium?.total ?? 0) >= 5) {
      insights.push("🚀 Great progress on medium difficulty!");
      recommendations.push("You're ready for harder challenges.");
    }
    
    if (easyAccuracy < 0.6 && (difficultyStats.easy?.total ?? 0) >= 3) {
      insights.push("📚 You might need more practice with basic concepts.");
      recommendations.push("Focus on mastering fundamentals before moving up.");
    }
    
    if (hardAccuracy < 0.4 && (difficultyStats.hard?.total ?? 0) >= 3) {
      insights.push("💪 Hard questions are challenging - that's normal!");
      recommendations.push("Practice more medium questions to build confidence.");
    }
    
    // Spaced repetition insights
    const dueForReview = questions.filter(q => 
      q.nextReviewDate && new Date(q.nextReviewDate) <= new Date()
    ).length;
    
    if (dueForReview > 0) {
      insights.push(`⏰ You have ${dueForReview} questions due for review.`);
      recommendations.push("Review these questions to maintain your progress.");
    }
    
    // Mastery level insights
    const masteredQuestions = questions.filter(q => q.masteryLevel >= 4).length;
    const totalQuestions = questions.length;
    const masteryPercentage = totalQuestions > 0 ? (masteredQuestions / totalQuestions * 100).toFixed(1) : 0;
    
    insights.push(`🏆 You've mastered ${masteryPercentage}% of the questions!`);
    
    if (masteryPercentage >= 80) {
      recommendations.push("Excellent progress! Consider adding new questions to your study set.");
    } else if (masteryPercentage >= 50) {
      recommendations.push("Good progress! Keep practicing to reach mastery.");
    } else {
      recommendations.push("Keep practicing regularly to improve your mastery level.");
    }
    
    return { insights, recommendations };
  };

  const generateAnalyticsReport = () => {
    const { totalQuestions, correctAnswers, incorrectAnswers, weakAreas, strongAreas, questionHistory, difficultyStats } = userPerformance;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100).toFixed(1) : 0;
    
    // Get top weak areas (questions user got wrong most)
    const topWeakAreas = Object.entries(weakAreas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([question, count]) => ({ question, count }));
    
    // Get top strong areas (questions user got right most)
    const topStrongAreas = Object.entries(strongAreas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([question, count]) => ({ question, count }));
    
    // Calculate difficulty-based analytics
    const difficultyAnalytics = {
      easy: {
        accuracy: (difficultyStats.easy?.total > 0) ? ((difficultyStats.easy?.correct / difficultyStats.easy.total) * 100).toFixed(1) : 0,
        total: difficultyStats.easy?.total ?? 0,
        correct: difficultyStats.easy?.correct ?? 0
      },
      medium: {
        accuracy: (difficultyStats.medium?.total > 0) ? ((difficultyStats.medium?.correct / difficultyStats.medium.total) * 100).toFixed(1) : 0,
        total: difficultyStats.medium?.total ?? 0,
        correct: difficultyStats.medium?.correct ?? 0
      },
      hard: {
        accuracy: (difficultyStats.hard?.total > 0) ? ((difficultyStats.hard?.correct / difficultyStats.hard.total) * 100).toFixed(1) : 0,
        total: difficultyStats.hard?.total ?? 0,
        correct: difficultyStats.hard?.correct ?? 0
      }
    };
    
    // Generate insights and recommendations
    const { insights, recommendations } = generateInsights();
    
    return {
      accuracy: parseFloat(accuracy),
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      topWeakAreas,
      topStrongAreas,
      difficultyAnalytics,
      insights,
      recommendations,
      averageTimePerQuestion: questionHistory.length > 0 
        ? questionHistory.reduce((sum, q) => sum + (60 - q.timeLeft), 0) / questionHistory.length 
        : 0
    };
  };

  const endGame = () => {
    // Check and update highest score
    if (score > highestScore) {
      setHighestScore(score);
      localStorage.setItem('highestScore', score.toString());
    }
    
    // Check and update highest streak
    if (maxStreak > highestStreak) {
      setHighestStreak(maxStreak);
      localStorage.setItem('highestStreak', maxStreak.toString());
    }
    
    // Save user performance data for analytics
    if (userPerformance.totalQuestions > 0) {
      const performanceData = {
        ...userPerformance,
        sessionEndTime: new Date().toISOString(),
        finalScore: score,
        finalStreak: maxStreak
      };
      localStorage.setItem('userPerformance', JSON.stringify(performanceData));
    }
    
    setGameState('results');
  };

  // Update startGame to remove unlimited mode logic
  const startGame = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLives(3);
    setTimeLeft(60);
    setShowResult(false);
    setSelectedAnswer('');
    setIsCorrect(false);
    setPowerUps({ skipQuestion: 2, extraTime: 2, fiftyFifty: 2 });
    setShowPowerUpEffect('');
  };

  // Update restartGame to remove unlimited mode logic
  const restartGame = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLives(3);
    setTimeLeft(60);
    setShowResult(false);
    setSelectedAnswer('');
    setIsCorrect(false);
    setPowerUps({ skipQuestion: 2, extraTime: 2, fiftyFifty: 2 });
    setShowPowerUpEffect('');
  };

  // Update startStudentQuiz to remove unlimited mode logic
  const startStudentQuiz = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLives(3);
    setTimeLeft(60);
    setShowResult(false);
    setSelectedAnswer('');
    setIsCorrect(false);
    setPowerUps({ skipQuestion: 2, extraTime: 2, fiftyFifty: 2 });
    setShowPowerUpEffect('');
  };

  const powerUp = (type) => {
    // Guard: do nothing if no current question
    if (!questions[currentQuestion]) return;
    switch (type) {
      case 'skipQuestion':
        setPowerUps({ ...powerUps, skipQuestion: powerUps.skipQuestion - 1 });
        if (currentQuestion + 1 < questions.length) {
          nextQuestion();
        } else {
          endGame();
        }
        break;
      case 'extraTime':
        setPowerUps({ ...powerUps, extraTime: powerUps.extraTime - 1 });
        setTimeLeft(Math.min(timeLeft + 10, 60));
        break;
      case 'fiftyFifty':
        setPowerUps({ ...powerUps, fiftyFifty: powerUps.fiftyFifty - 1 });
        const currentQ = questions[currentQuestion];
        if (!currentQ) return;
        const correctAnswer = currentQ.correct;
        const incorrectOptions = currentOptions.filter(opt => opt !== correctAnswer);
        const optionsToRemove = incorrectOptions.slice(0, 2);
        setCurrentOptions(currentOptions.filter(opt => !optionsToRemove.includes(opt)));
        break;
      default: break;
    }
  };

  const getScoreRating = () => {
    const percentage = (score / (questions.length * 100)) * 100;
    if (percentage >= 90) return { rating: "🏆 CHAMPION!", color: "text-yellow-400" };
    if (percentage >= 80) return { rating: "⭐ EXCELLENT!", color: "text-blue-400" };
    if (percentage >= 70) return { rating: "🎯 GREAT JOB!", color: "text-green-400" };
    if (percentage >= 60) return { rating: "👍 GOOD WORK!", color: "text-purple-400" };
    return { rating: "💪 KEEP TRYING!", color: "text-red-400" };
  };

  // Share score function with screenshot
  const shareScore = async () => {
    try {
      // Take screenshot of the results page
      const resultsElement = document.querySelector('.bg-white\\/10.backdrop-blur-lg.rounded-3xl');
      if (resultsElement) {
        // Use html2canvas to capture the screenshot
        const html2canvas = await import('html2canvas');
        const canvas = await html2canvas.default(resultsElement, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'fluence-quiz-score.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              // Share the screenshot file
              await navigator.share({
                title: 'Fluence Quiz Score',
                text: `🎉 I scored ${score} points in the Fluence Quiz! Can you beat my score? 🏆`,
                files: [file]
              });
            } else {
              // Fallback: download the screenshot
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'fluence-quiz-score.png';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              setShowShareSuccess(true);
              setTimeout(() => setShowShareSuccess(false), 3000);
            }
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('Error sharing screenshot:', error);
      // Fallback to text sharing
      const { rating } = getScoreRating();
      const shareText = `🎉 I scored ${score} points on Fluence Quiz! ${rating} 
      
Questions: ${Math.min(currentQuestion + 1, questions.length)}/${questions.length}
Max Streak: ${maxStreak} 🔥

Try the quiz yourself!`;
      
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'My Fluence Quiz Score',
            text: shareText,
            url: window.location.href
          });
        } else {
          await navigator.clipboard.writeText(shareText);
          setShowShareSuccess(true);
          setTimeout(() => setShowShareSuccess(false), 2000);
        }
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  };

  // Load available voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        setVoices(allVoices);
        if (allVoices.length > 0 && !voice) {
          setVoice(allVoices[0]);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [voice]);

  // Helper to auto-select voice
  function getVoiceForText(text, voices) {
    // Simple check: if text contains Devanagari, use Hindi
    const hindiChar = /[\u0900-\u097F]/;
    if (hindiChar.test(text)) {
      return voices.find(v => v.lang && v.lang.startsWith('hi')) || voices[0];
    }
    // Otherwise, prefer English
    return voices.find(v => v.lang && v.lang.startsWith('en')) || voices[0];
  }

  // Mastery persistence: load mastery from localStorage and merge into questions
  useEffect(() => {
    const masteryData = localStorage.getItem('fluenceQuizMastery');
    if (masteryData) {
      try {
        const masteryMap = JSON.parse(masteryData);
        setQuestions(prevQuestions => prevQuestions.map(q =>
          masteryMap[q.id] ? { ...q, masteryLevel: masteryMap[q.id] } : q
        ));
      } catch {}
    }
  }, [questions.length]);

  // When updating masteryLevel, persist to localStorage
  useEffect(() => {
    if (questions.length > 0) {
      const masteryMap = {};
      questions.forEach(q => {
        if (q.id !== undefined && q.masteryLevel !== undefined) {
          masteryMap[q.id] = q.masteryLevel;
        }
      });
      localStorage.setItem('fluenceQuizMastery', JSON.stringify(masteryMap));
    }
  }, [questions]);

  if (gameState === 'menu') {
    // Show student quiz interface if in student quiz mode
    if (studentQuizMode) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/20">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2 animate-pulse flex items-center justify-center gap-2">
                🎓 Student Quiz
              </h1>
              <p className="text-white/80 text-lg">Welcome, {playerName}!</p>
            </div>
            
            {/* Show quiz update date for student users */}
            {quizUpdateDate && (
              <div className="mb-6 flex items-center justify-center gap-2 text-white/60 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Quiz updated on: {quizUpdateDate.toLocaleDateString('en-GB')}</span>
              </div>
            )}
            
            {/* Show error if questions fail to load */}
            {questionLoadError && (
              <div className="mb-6 text-red-300 text-sm">{questionLoadError}</div>
            )}
            
            <button
              onClick={startStudentQuiz}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg mb-4"
              disabled={!!questionLoadError || questions.length === 0}
            >
              START QUIZ
            </button>
            
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setMusicEnabled(!musicEnabled)}
                className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                {musicEnabled ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white" />}
              </button>
              <button
                onClick={() => setSfxEnabled(!sfxEnabled)}
                className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                {sfxEnabled ? <Star className="w-6 h-6 text-white" /> : <Star className="w-6 h-6 text-white/50" />}
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular menu interface
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/20">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 animate-pulse flex items-center justify-center gap-2">
              <Target className="w-8 h-8 text-pink-400 inline-block" /> Fluence Quiz
            </h1>
            <p className="text-white/80 text-lg">Test your knowledge!</p>
          </div>
          
          {/* Show personal records if they exist */}
          {(highestScore > 0 || highestStreak > 0) && (
            <div className="mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-400/20">
              <h4 className="text-yellow-300 font-bold mb-2 text-sm">🏆 Your Records</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-xs">Best Score</p>
                  <p className="text-yellow-300 font-bold">{highestScore}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Best Streak</p>
                  <p className="text-yellow-300 font-bold">{highestStreak} 🔥</p>
                </div>
              </div>
            </div>
          )}
          <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              onKeyPress={(e) => e.key === 'Enter' && (isStudentQuiz ? startStudentQuiz() : startGame())}
            />
            
            {/* Show which student quiz is being taken */}
            {isStudentQuiz && (
              <div className="mt-2 flex items-center justify-center gap-2 text-blue-300 text-sm font-medium">
                <span>🎓 Student Quiz</span>
              </div>
            )}
            {/* Show error if questions fail to load */}
            {questionLoadError && (
              <div className="mt-4 text-red-300 text-sm">{questionLoadError}</div>
            )}
          </div>
          <button
            onClick={isStudentQuiz ? startStudentQuiz : startGame}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg mb-4"
            disabled={!playerName || !!questionLoadError || questions.length === 0}
          >
            START QUIZ
          </button>
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              {musicEnabled ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white" />}
            </button>
            <button
              onClick={() => setSfxEnabled(!sfxEnabled)}
              className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              {sfxEnabled ? <Star className="w-6 h-6 text-white" /> : <Star className="w-6 h-6 text-white/50" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const { rating, color } = getScoreRating();
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/20">
          <div className="mb-8">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
            <p className="text-white/80">Great job, {playerName}!</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-white/20 rounded-xl p-4">
              <h3 className={`text-2xl font-bold ${color} mb-2`}>{rating}</h3>
              <p className="text-white text-xl">Final Score: {score}</p>
            </div>
            
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-white">Max Streak: {maxStreak} 🔥</p>
              <p className="text-white">Questions Answered: {Math.min(currentQuestion + 1, questions.length)}/{questions.length}</p>
            </div>
            
            {/* Highest Records */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30">
              <h4 className="text-yellow-300 font-bold mb-2">🏆 Personal Records</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/80 text-sm">Highest Score</p>
                  <p className="text-yellow-300 font-bold text-lg">{highestScore}</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm">Highest Streak</p>
                  <p className="text-yellow-300 font-bold text-lg">{highestStreak} 🔥</p>
                </div>
              </div>
              {/* Show new record indicators */}
              {score >= highestScore && score > 0 && (
                <div className="mt-2 text-green-400 text-sm font-bold animate-pulse">
                  🎉 New High Score!
                </div>
              )}
              {maxStreak >= highestStreak && maxStreak > 0 && (
                <div className="mt-1 text-green-400 text-sm font-bold animate-pulse">
                  🔥 New Best Streak!
                </div>
              )}
            </div>

            {/* Performance Insights and Recommendations */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-400/30">
              <h4 className="text-purple-300 font-bold mb-3">🧠 Learning Insights</h4>
              {(() => {
                const { insights, recommendations } = generateInsights();
                return (
                  <div className="space-y-3">
                    {insights.length > 0 && (
                      <div>
                        <h5 className="text-white font-semibold mb-2">📊 Your Progress:</h5>
                        <ul className="text-white/90 text-sm space-y-1">
                          {insights.slice(0, 3).map((insight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span>•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {recommendations.length > 0 && (
                      <div>
                        <h5 className="text-white font-semibold mb-2">💡 Recommendations:</h5>
                        <ul className="text-white/90 text-sm space-y-1">
                          {recommendations.slice(0, 2).map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={shareScore}
              className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              SHARE SCORE
            </button>
            
            <button
              onClick={restartGame}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              PLAY AGAIN
            </button>
          </div>
          
          {/* Share Success Message */}
          {showShareSuccess && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl text-green-300 text-sm">
              ✅ Screenshot saved! Check your downloads folder.
            </div>
          )}
          
          {/* Powered by Fluence Footer */}
          <div className="mt-8 pt-4 border-t border-white/20">
            <p className="text-white/40 text-sm text-center">
              Powered by <span className="font-semibold text-white/60">Fluence</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 shadow-xl border border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-white">
                <span className="text-sm opacity-80">Score</span>
                <div className="text-xl font-bold">{score}</div>
              </div>
              <div className="text-white">
                <span className="text-sm opacity-80">Streak</span>
                <div className="text-xl font-bold">{streak} 🔥</div>
              </div>
              <div className="text-white">
                <span className="text-sm opacity-80">Lives</span>
                <div className="text-xl">{'❤️'.repeat(Math.max(0, lives))}</div>
              </div>
            </div>
            
            <div className="text-white text-right">
              <div className="text-sm opacity-80">
                Question {currentQuestion + 1}/{questions.length}
              </div>
              <div className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : ''}`}>{timeLeft}s</div>
            </div>
          </div>
        </div>

        {/* Power-ups */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 shadow-xl border border-white/20">
          <div className="flex gap-3">
            <button
              onClick={() => powerUp('skipQuestion')}
              disabled={powerUps.skipQuestion <= 0}
              className={`flex-1 p-3 rounded-xl text-white font-bold transition-all ${
                powerUps.skipQuestion > 0 
                  ? 'bg-yellow-500 hover:bg-yellow-600 transform hover:scale-105' 
                  : 'bg-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              🚀 Skip ({powerUps.skipQuestion})
            </button>
            <button
              onClick={() => powerUp('extraTime')}
              disabled={powerUps.extraTime <= 0}
              className={`flex-1 p-3 rounded-xl text-white font-bold transition-all ${
                powerUps.extraTime > 0 
                  ? 'bg-blue-500 hover:bg-blue-600 transform hover:scale-105' 
                  : 'bg-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              ⏰ +10s ({powerUps.extraTime})
            </button>
            <button
              onClick={() => powerUp('fiftyFifty')}
              disabled={powerUps.fiftyFifty <= 0}
              className={`flex-1 p-3 rounded-xl text-white font-bold transition-all ${
                powerUps.fiftyFifty > 0 
                  ? 'bg-purple-500 hover:bg-purple-600 transform hover:scale-105' 
                  : 'bg-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              ✂️ 50/50 ({powerUps.fiftyFifty})
            </button>
          </div>
        </div>

        {/* Question */}
        {questions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl py-4 px-3 mb-6 shadow-xl border border-white/20">
            <div className="text-center">
              <p className="text-white text-2xl font-bold mb-3 leading-relaxed">
                {questions[currentQuestion].question}
              </p>
              {/* Minimal TTS Controls */}
              <div className="flex justify-center gap-4 mb-2 items-center">
                <button
                  aria-label="Replay at normal speed"
                  className="hover:bg-white/20 rounded-full p-2 transition-colors text-2xl"
                  onClick={() => speak(questions[currentQuestion].question, 1)}
                >
                  🔊
                </button>
                <button
                  aria-label="Replay at slow speed"
                  className="hover:bg-white/20 rounded-full p-2 transition-colors text-2xl"
                  onClick={() => speak(questions[currentQuestion].question, 0.4)}
                >
                  🐢
                </button>
              </div>
              
              {showPowerUpEffect && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl animate-ping">✨</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentOptions.map((option, index) => (
            <button
              key={`${currentQuestion}-${index}`}
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult}
              className={`p-6 rounded-xl font-bold text-left transition-all duration-300 transform hover:scale-105 shadow-lg ${
                showResult
                  ? option === questions[currentQuestion]?.correct
                    ? 'bg-green-500 text-white'
                    : option === selectedAnswer
                    ? 'bg-red-500 text-white lifted'
                    : 'bg-white/20 text-white/60'
                  : selectedAnswer === option
                  ? 'bg-white/20 text-white lifted'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span className="text-lg">{String.fromCharCode(65 + index)}.</span>
              <span className="ml-3 text-lg">{option}</span>
            </button>
          ))}
        </div>

        {/* Result feedback */}
        {showResult && (
          <div className="mt-6 text-center">
            <div className={`text-4xl font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{isCorrect ? '🎉 Correct!' : '❌ Wrong!'}</div>
            {isCorrect && streak > 1 && (
              <div className="text-yellow-400 text-xl font-bold">
                🔥 {streak} Streak! +{streak * 10} Bonus!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HindiEnglishQuiz;