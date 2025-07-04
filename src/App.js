import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Star, Trophy, Target, Zap } from 'lucide-react';

const HindiEnglishQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [gameState, setGameState] = useState('menu'); // menu, playing, results
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isCorrect, setIsCorrect] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
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
  
  const timerRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  const utteranceRef = useRef(null);

  // Quiz questions data
  const quizData = [
    { 
      question: "What does \"to feel under the weather\" mean?", 
      correct: "To feel slightly ill or sick", 
      options: ["To enjoy bad weather", "To feel slightly ill or sick", "To be outdoors in the rain", "To forecast the weather"] 
    },
    { 
      question: "If something \"costs an arm and a leg,\" what does that mean?", 
      correct: "It's very expensive", 
      options: ["It's very easy to obtain", "It's very painful to get", "It's very expensive", "It requires physical effort"] 
    },
    { 
      question: "\"I have a big exam next week, so I need to ______ this weekend.\" Which idiom best fits here?", 
      correct: "hit the books", 
      options: ["let the cat out of the bag", "cost an arm and a leg", "hit the books", "break the ice"] 
    },
    { 
      question: "What does it mean \"to let the cat out of the bag\"?", 
      correct: "To reveal a secret carelessly or by mistake", 
      options: ["To put a cat in a bag", "To reveal a secret carelessly or by mistake", "To free an animal", "To hide something important"] 
    },
    { 
      question: "\"I have given you my advice; now the ______ is in your court.\"", 
      correct: "ball", 
      options: ["ball", "apple", "cat", "hand"] 
    },
    { 
      question: "If someone is \"the apple of one's eye,\" what are they?", 
      correct: "A person who is cherished above all others", 
      options: ["A difficult person to understand", "A source of annoyance", "A person who is cherished above all others", "A sharp observer"] 
    },
    { 
      question: "What does \"at the eleventh hour\" mean?", 
      correct: "At the very last minute", 
      options: ["Very early in the morning", "Precisely at 11:00 AM", "At the very last minute", "With plenty of time to spare"] 
    },
    { 
      question: "\"Life is not always a _____; you have to work hard.\"", 
      correct: "bed of roses", 
      options: ["hard nut to crack", "bed of roses", "drop in the ocean", "storm in a teacup"] 
    },
    { 
      question: "What does \"to beat around the bush\" imply?", 
      correct: "To avoid talking about the main topic and speak in a roundabout way", 
      options: ["To speak clearly and directly", "To avoid talking about the main topic and speak in a roundabout way", "To search for something in nature", "To talk about gardening"] 
    },
    { 
      question: "If you \"bite the bullet,\" what are you doing?", 
      correct: "Facing a difficult situation with courage", 
      options: ["Eating something very hard", "Facing a difficult situation with courage", "Giving up easily", "Making a quick decision"] 
    },
    { 
      question: "What is the meaning of \"to break the ice\"?", 
      correct: "To say or do something to relieve tension and start a conversation", 
      options: ["To cause an argument", "To make a situation more difficult", "To say or do something to relieve tension and start a conversation", "To destroy something cold"] 
    },
    { 
      question: "\"She was ______ to prepare for her final exams.\"", 
      correct: "burning the midnight oil", 
      options: ["crying over spilt milk", "cutting corners", "burning the midnight oil", "facing the music"] 
    },
    { 
      question: "What does \"to cry over spilt milk\" mean?", 
      correct: "To be unhappy about something that has happened and cannot be changed", 
      options: ["To be happy about a small accident", "To be unhappy about something that has happened and cannot be changed", "To regret drinking milk", "To clean up a mess"] 
    },
    { 
      question: "If a company was \"cutting corners on safety procedures,\" what were they doing?", 
      correct: "Doing something in the easiest or cheapest way, often by sacrificing quality", 
      options: ["Improving safety standards", "Doing something in the easiest or cheapest way, often by sacrificing quality", "Investing heavily in safety", "Following all regulations strictly"] 
    },
    { 
      question: "What does it mean \"to face the music\"?", 
      correct: "To accept criticism or punishment for something you have done", 
      options: ["To enjoy a concert", "To avoid responsibility", "To accept criticism or punishment for something you have done", "To play a musical instrument"] 
    },
    { 
      question: "\"This math problem is a ______.\"", 
      correct: "hard nut to crack", 
      options: ["piece of cake", "bed of roses", "hard nut to crack", "blessing in disguise"] 
    },
    { 
      question: "What does \"to get the ball rolling\" mean?", 
      correct: "To start a process or activity", 
      options: ["To stop a process", "To start a process or activity", "To play a game", "To wait for something to happen"] 
    },
    { 
      question: "If you are \"pulling someone's leg,\" what are you doing?", 
      correct: "Joking with someone by telling them something that is not true", 
      options: ["Helping them stand up", "Seriously hurting them", "Joking with someone by telling them something that is not true", "Competing with them physically"] 
    },
    { 
      question: "\"My brother and I don't always ______ on political issues.\"", 
      correct: "see eye to eye", 
      options: ["turn a deaf ear", "see eye to eye", "hit the nail on the head", "pull someone's leg"] 
    },
    { 
      question: "What does \"once in a blue moon\" signify?", 
      correct: "Very rarely", 
      options: ["Very frequently", "Every night", "Very rarely", "During a full moon"] 
    }
  ];

  // Generate multiple choice options for each question
  const generateOptions = (question) => {
    return question.options.sort(() => Math.random() - 0.5);
  };

  const [questions, setQuestions] = useState([]);
  const [currentOptions, setCurrentOptions] = useState([]);

  // Fetch questions from JSON file based on student parameter
  useEffect(() => {
    // Get student parameter from URL (e.g., ?student=1, ?student=2, ?student=3)
    const urlParams = new URLSearchParams(window.location.search);
    const student = urlParams.get('student') || '1'; // Default to student 1
    
    // Load appropriate question file (relative path)
    const questionFile = `questions-student${student}.json`;
    
    fetch(questionFile)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const shuffledQuestions = [...data].sort(() => Math.random() - 0.5).slice(0, 15);
        setQuestions(shuffledQuestions);
      })
      .catch(error => {
        console.error('Error loading questions:', error);
        // Fallback to default questions if student-specific file fails
        fetch('questions.json')
          .then(response => response.json())
          .then(data => {
            const shuffledQuestions = [...data].sort(() => Math.random() - 0.5).slice(0, 15);
            setQuestions(shuffledQuestions);
          })
          .catch(fallbackError => {
            console.error('Error loading fallback questions:', fallbackError);
            setQuestions([]);
          });
      });
  }, []);

  useEffect(() => {
    if (questions.length > 0 && currentQuestion < questions.length) {
      const options = generateOptions(questions[currentQuestion]);
      setCurrentOptions(options);
    }
  }, [currentQuestion, questions]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !showResult) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp();
    }
    
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, gameState, showResult]);

  // Sound effects
  const playSound = (type) => {
    if (!sfxEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'correct':
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        break;
      case 'wrong':
        oscillator.frequency.setValueAtTime(196, audioContext.currentTime); // G3
        oscillator.frequency.setValueAtTime(174.61, audioContext.currentTime + 0.1); // F3
        break;
      case 'click':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        break;
      case 'powerup':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2);
        break;
    }
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleAnswerSelect = (answer) => {
    if (showResult) return;
    
    playSound('click');
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const correct = answer === questions[currentQuestion].correct;
    setIsCorrect(correct);
    
    if (correct) {
      playSound('correct');
      const points = timeLeft > 10 ? 100 : timeLeft > 5 ? 80 : 50;
      const streakBonus = streak * 10;
      setScore(score + points + streakBonus);
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
    } else {
      playSound('wrong');
      setStreak(0);
      setLives(lives - 1);
    }
    
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length && lives > 0) {
        nextQuestion();
      } else {
        endGame();
      }
    }, 2000);
  };

  const nextQuestion = () => {
    setCurrentQuestion(currentQuestion + 1);
    setSelectedAnswer('');
    setShowResult(false);
    setTimeLeft(25);
  };

  const handleTimeUp = () => {
    setShowResult(true);
    setIsCorrect(false);
    setStreak(0);
    setLives(lives - 1);
    playSound('wrong');
    
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length && lives > 0) {
        nextQuestion();
      } else {
        endGame();
      }
    }, 2000);
  };

  const endGame = () => {
    setGameState('results');
  };

  const startGame = () => {
    if (!playerName.trim()) {
      setShowNameInput(true);
      return;
    }
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(25);
    setLives(3);
    setPowerUps({ skipQuestion: 2, extraTime: 2, fiftyFifty: 2 });
  };

  const restartGame = () => {
    setGameState('menu');
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedAnswer('');
    setShowResult(false);
    setTimeLeft(25);
    setLives(3);
    setPowerUps({ skipQuestion: 2, extraTime: 2, fiftyFifty: 2 });
  };

  const powerUp = (type) => {
    if (powerUps[type] <= 0) return;
    
    playSound('powerup');
    setShowPowerUpEffect(type);
    setTimeout(() => setShowPowerUpEffect(''), 1000);
    
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
        setTimeLeft(Math.min(timeLeft + 10, 25));
        break;
      case 'fiftyFifty':
        setPowerUps({ ...powerUps, fiftyFifty: powerUps.fiftyFifty - 1 });
        const correctAnswer = questions[currentQuestion].correct;
        const incorrectOptions = currentOptions.filter(opt => opt !== correctAnswer);
        const optionsToRemove = incorrectOptions.slice(0, 2);
        setCurrentOptions(currentOptions.filter(opt => !optionsToRemove.includes(opt)));
        break;
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

  // Enhanced speak function with all controls
  function speak(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.voice = voice;
      utter.pitch = pitch;
      utter.rate = rate;
      utter.volume = volume;
      utter.lang = 'en-US'; // or 'hi-IN' for Hindi
      
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onpause = () => setIsPaused(true);
      utter.onresume = () => setIsPaused(false);
      
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    }
  }

  // Auto-speak on question change
  useEffect(() => {
    if (gameState === 'playing' && questions.length > 0 && currentQuestion < questions.length) {
      speak(questions[currentQuestion].question);
    }
  }, [currentQuestion, gameState, voice, pitch, rate, volume]);

  // Speech control functions
  const handlePlay = () => {
    if (questions.length > 0 && currentQuestion < questions.length) {
      speak(questions[currentQuestion].question);
    }
  };

  const handlePause = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  };

  const handleResume = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/20">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 animate-pulse flex items-center justify-center gap-2">
              <Target className="w-8 h-8 text-pink-400 inline-block" /> English Idioms Quiz
            </h1>
            <p className="text-white/80 text-lg">Test your knowledge of English idioms!</p>
          </div>
          
          {showNameInput ? (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                onKeyPress={(e) => e.key === 'Enter' && startGame()}
              />
            </div>
          ) : null}
          
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg mb-4"
          >
            {playerName ? 'START GAME' : 'ENTER NAME TO START'}
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
          </div>
          
          <button
            onClick={restartGame}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            PLAY AGAIN
          </button>
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
                <div className="text-2xl font-bold">{score}</div>
              </div>
              <div className="text-white">
                <span className="text-sm opacity-80">Streak</span>
                <div className="text-2xl font-bold">{streak} 🔥</div>
              </div>
              <div className="text-white">
                <span className="text-sm opacity-80">Lives</span>
                <div className="text-2xl">{'❤️'.repeat(Math.max(0, lives))}</div>
              </div>
            </div>
            
            <div className="text-white text-right">
              <div className="text-sm opacity-80">Question {currentQuestion + 1}/{questions.length}</div>
              <div className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : ''}`}>{timeLeft}s</div>
            </div>
          </div>
        </div>

        {/* Power-ups */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 shadow-xl border border-white/20">
          <h3 className="text-white font-bold mb-3">Power-ups</h3>
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
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl py-4 px-8 mb-6 shadow-xl border border-white/20">
            <div className="text-center">
              <h2 className="text-white text-sm opacity-80 mb-2">Choose the correct answer:</h2>
              <p className="text-white text-2xl font-bold mb-6 leading-relaxed">
                {questions[currentQuestion].question}
              </p>
              
              {/* Text-to-Speech Controls */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="flex flex-wrap justify-center items-center gap-4 mb-3">
                  <button
                    onClick={handlePlay}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isPaused ? 'Resume' : 'Play'}
                  </button>
                  <button
                    onClick={handlePause}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    Pause
                  </button>
                  <button
                    onClick={handleStop}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    Stop
                  </button>
                  {isSpeaking && (
                    <span className="text-green-400 text-sm animate-pulse">Speaking...</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-white/80 block mb-1">Voice:</label>
                    <select
                      value={voice?.name || ''}
                      onChange={(e) => setVoice(voices.find(v => v.name === e.target.value))}
                      className="w-full bg-white/10 text-white rounded px-2 py-1 border border-white/20"
                    >
                      {voices.map(v => (
                        <option key={v.name} value={v.name} className="bg-gray-800">
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-white/80 block mb-1">Pitch: {pitch}</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={pitch}
                      onChange={(e) => setPitch(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white/80 block mb-1">Speed: {rate}</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={rate}
                      onChange={(e) => setRate(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white/80 block mb-1">Volume: {volume}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
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
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult}
              className={`p-6 rounded-xl font-bold text-left transition-all duration-300 transform hover:scale-105 shadow-lg ${
                showResult
                  ? option === questions[currentQuestion]?.correct
                    ? 'bg-green-500 text-white'
                    : option === selectedAnswer
                    ? 'bg-red-500 text-white'
                    : 'bg-white/20 text-white/60'
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