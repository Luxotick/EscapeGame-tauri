"use client";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MorseCodeGame } from './morse-code-game';

/* 
  ====================
  LABİRENT OYUNU (4. SORU)
  ====================
*/
function generateMaze(rows = 25, cols = 25) {
  const maze = Array.from({ length: rows }, () => Array(cols).fill(1));
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  const directions = [
    [-1, 0], // yukarı
    [0, 1],  // sağ
    [1, 0],  // aşağı
    [0, -1], // sol
  ];

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carvePath(r, c) {
    visited[r][c] = true;
    maze[r][c] = 0;
    const dirs = shuffle([...directions]);
    for (const [dr, dc] of dirs) {
      const nr = r + 2 * dr;
      const nc = c + 2 * dc;
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        !visited[nr][nc]
      ) {
        // Aradaki hücreyi de aç
        maze[r + dr][c + dc] = 0;
        visited[nr][nc] = true;
        maze[nr][nc] = 0;
        carvePath(nr, nc);
      }
    }
  }

  carvePath(0, 0);
  // çıkış
  maze[rows - 1][cols - 1] = 2;
  return maze;
}

function canReachExit(maze, sr, sc) {
  const rows = 25;
  const cols = 25;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue = [[sr, sc]];
  visited[sr][sc] = true;

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    if (maze[r][c] === 2) return true; // çıkış
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !visited[nr][nc] &&
        maze[nr][nc] !== 1
      ) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return false;
}

function MazeGame({
  onComplete,
  enableRotation,
  rotationMin,
  rotationMax,
  mapChangeInterval,
}) {
  const [maze, setMaze] = useState([]);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [rotation, setRotation] = useState(0);

  // İlk labirent oluşturma
  useEffect(() => {
    const newMaze = generateMaze(25, 25);
    setMaze(newMaze);
  }, []);

  function applyRandomRotation() {
    const angles = [45, 90, 135, 180, 225, 270, 315];
    let newAngle = angles[Math.floor(Math.random() * angles.length)];
    while (newAngle === rotation) {
      newAngle = angles[Math.floor(Math.random() * angles.length)];
    }
    setRotation(newAngle);
  }

  // Dönme (enableRotation)
  useEffect(() => {
    if (!enableRotation) return;
    const minDelay = rotationMin <= 0 ? 1 : rotationMin;
    const maxDelay = rotationMax < minDelay ? minDelay : rotationMax;

    const randomInterval = Math.random() * (maxDelay - minDelay) + minDelay;
    const timer = setTimeout(() => {
      applyRandomRotation();
    }, randomInterval * 1000);

    return () => clearTimeout(timer);
  }, [rotation, enableRotation, rotationMin, rotationMax]);

  // Yol Değiştirme
  useEffect(() => {
    if (!mapChangeInterval || mapChangeInterval < 400) return;
    if (maze.length === 0) return;

    const interval = setInterval(() => {
      const mazeCopy = maze.map((row) => [...row]);
      const changedCells = [];

      let togglesCount = 2;
      while (togglesCount > 0) {
        const rr = Math.floor(Math.random() * 25);
        const cc = Math.floor(Math.random() * 25);

        // exit & player dokunma
        if ((rr === 24 && cc === 24) || (rr === playerPos.row && cc === playerPos.col)) {
          continue;
        }
        if (mazeCopy[rr][cc] === 2) continue;

        const oldVal = mazeCopy[rr][cc];
        if (oldVal === 1) {
          mazeCopy[rr][cc] = 0;
        } else if (oldVal === 0) {
          mazeCopy[rr][cc] = 1;
        }
        changedCells.push({ r: rr, c: cc, oldVal });
        togglesCount--;
      }

      const ok = canReachExit(mazeCopy, playerPos.row, playerPos.col);
      if (ok) {
        setMaze(mazeCopy);
      } else {
        // revert
        const revertMaze = mazeCopy.map((row) => [...row]);
        for (const { r, c, oldVal } of changedCells) {
          revertMaze[r][c] = oldVal;
        }
        setMaze(revertMaze);
      }
    }, mapChangeInterval);

    return () => clearInterval(interval);
  }, [maze, mapChangeInterval, playerPos]);

  // Hücreye tıklayınca hareket
  const handleCellClick = (r, c) => {
    const rowDiff = Math.abs(r - playerPos.row);
    const colDiff = Math.abs(c - playerPos.col);
    if (rowDiff + colDiff === 1 && maze[r][c] !== 1) {
      setPlayerPos({ row: r, col: c });
      if (maze[r][c] === 2) {
        onComplete && onComplete(); // çıkış
      }
    }
  };

  if (maze.length === 0) {
    return <div className="text-white">Labirent Yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col items-center mt-4">
      <p className="text-center mb-4">
        25x25 labirent,{" "}
        {enableRotation
          ? `her ${rotationMin}-${rotationMax}s arası dönüyor, `
          : "dönme devre dışı, "}
        harita her {mapChangeInterval / 1000}s&apos;de bir değişebilir.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(25, 24px)`,
          gridTemplateColumns: `repeat(25, 24px)`,
          transform: enableRotation ? `rotate(${rotation}deg)` : "",
          transition: "transform 0.5s ease",
        }}
      >
        {maze.map((rowArr, rowIndex) =>
          rowArr.map((cellVal, colIndex) => {
            const isPlayer =
              playerPos.row === rowIndex && playerPos.col === colIndex;
            let cellColor;
            if (cellVal === 1) {
              cellColor = "bg-gray-700"; // Duvar
            } else if (cellVal === 2) {
              cellColor = "bg-yellow-500"; // Çıkış
            } else {
              cellColor = "bg-gray-300"; // Yol
            }
            if (isPlayer) {
              cellColor = "bg-red-500"; // Oyuncu
            }

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`${cellColor} w-6 h-6 border border-white cursor-pointer`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/* 
  =====================
  ANA UYGULAMA
  =====================
*/
export default function App() {
  /** SORULAR */
  const questions = [
    {
      question:
        "İlk soruya hoş geldiniz.. Bu bilgisayar içindeki 'belgeler' klasöründe bir exe dosyası gizledik, dosyanın ismini türkçe karşılığı ile değiştirip submit answer tuşuna basın.",
      correctAnswer: "",
      requiresInput: false,
      inputType: "file",
      
    },
    {
      question:
        "İkinci soruya geçtiniz... Biraz da frc üzerinden gidelim, 9 eksenli teker modülünün ismi?",
      correctAnswer: "swerve",
      requiresInput: true,
      inputType: "text",
    },
    {
      question:
        "Üçüncü soru... Bu seferde belgeler içerisindeki bir png dosyasının içeriğine bir kelime gizledik onu bulabilir misin? Renk ayarlarıyla oynamayı düşünebilirsin :==)",
      correctAnswer: "dayıoğlu",
      requiresInput: true,
      inputType: "text",
    },
    {
      question: "",
      correctAnswer: "",
      requiresInput: false,
      inputType: "maze",
    },
    {
      question:
        "Geçen seneki Haliç Regional kazananlarından birinin takım numarası?",
        correctAnswer: ["8214", "9609", "9523"], // 3 farklı doğru cevap
        requiresInput: true,
      inputType: "text",
    },
    {
      question:
        "EalRobotik kulübünün frc numarası?",
        correctAnswer: "8828", // 3 farklı doğru cevap
        requiresInput: true,
      inputType: "text",
    },
    {
      question:
        "'dayıoğlu' kelimesinin Caesar şifrelemesi ile anahtar 7 alınarak şifrelenmiş halini yazın (türkçe alfabe)",
        correctAnswer: "igeoumsc",
        requiresInput: true,
      inputType: "text",
    },
    {
      question: "Decode the Morse code message displayed by the LED.",
      correctAnswer: "kickoff",
      requiresInput: false,
      inputType: "morse",
    },

  ];

  /** STATE’LER */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [question, setQuestion] = useState(questions[0].question); // İlki
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // DevMode
  const [devMode, setDevMode] = useState(false);
  const [devModeAvailable, setDevModeAvailable] = useState(false);

  // Maze Dev Panel
  const [enableRotation, setEnableRotation] = useState(true);
  const [rotationMin, setRotationMin] = useState(3);
  const [rotationMax, setRotationMax] = useState(6);
  const [mapChangeInterval, setMapChangeInterval] = useState(500);

  /** useEffect: DevMode & questionIndex */
  useEffect(() => {
    const storedDev = localStorage.getItem("devMode");
    const savedIndex = localStorage.getItem("questionIndex");
    
    if (storedDev === "true" && !devMode) {
      setDevMode(true);
      if (savedIndex !== null) {
        const idx = Number(savedIndex);
        setCurrentQuestionIndex(idx);
        setQuestion(questions[idx].question);
      }
    }
  }, []); // Empty dependency array - only runs once on mount

  useEffect(() => {
    const checkDevMode = async () => {
      try {
        const isDevMode = await invoke('is_dev_mode');
        setDevModeAvailable(isDevMode);
      } catch (error) {
        console.error('Error checking dev mode:', error);
        // If the command is not found, we're likely in production mode
        setDevModeAvailable(false);
      }
    };
    checkDevMode();
  }, []);

  // DevMode / questionIndex -> localStorage
  useEffect(() => {
    if (devMode) {
      localStorage.setItem("questionIndex", String(currentQuestionIndex));
    }
  }, [devMode, currentQuestionIndex]);

  // 1. Soruda exe dosyası
  useEffect(() => {
    const createFile = async () => {
      try {
        const result = await invoke("create_exe_file");
        console.log("File created at:", result);
      } catch (error) {
        console.error("Error creating file:", error);
        setErrorMessage("Dosya oluşturulurken bir hata oluştu.");
      }
    };
    createFile();
  }, []);

  /** Fonksiyonlar */
  const toggleDevMode = () => {
    setDevMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("devMode", newValue.toString());
      if (!newValue) {
        // When turning dev mode off, reset to current question
        localStorage.removeItem("questionIndex");
      }
      return newValue;
    });
  };

  const checkAnswer = async () => {
    const currentQ = questions[currentQuestionIndex];
    setErrorMessage(""); // önceki hata temizle
  
    if (currentQ.requiresInput) {
      const userAnswerLower = userAnswer.toLowerCase();
      const correctAnswers = Array.isArray(currentQ.correctAnswer)
        ? currentQ.correctAnswer.map((answer) => answer.toLowerCase())
        : [currentQ.correctAnswer.toLowerCase()];
  
      if (correctAnswers.includes(userAnswerLower)) {
        setIsCorrect(true);
        setSuccessMessage("Soruyu doğru bildin!");
      } else {
        setErrorMessage("Cevabınız yanlış, tekrar deneyin.");
      }
    } else {
      // file
      if (currentQ.inputType === "file") {
        try {
          const result = await invoke("check_file_name");
          if (result) {
            setIsCorrect(true);
            setSuccessMessage("Soruyu doğru bildin!");
          } else {
            setIsCorrect(false);
            alert("Yanlış! Dosya adı yanlış.");
          }
        } catch (error) {
          setIsCorrect(false);
          alert("Dosya adı kontrolünde bir hata oluştu.");
        }
      }
    }
  };

  async function copyImage() {
    try {
      const result = await invoke("copy_image");
      if (result) {
        console.log("Fotoğraf kopyalandı:", result);
      } else {
        console.error("Fotoğraf kopyalanamadı.");
      }
    } catch (error) {
      alert(error);
    }
  }

  /** SONRAKİ SORU */
  const nextPuzzle = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      // Yeni sorunun metni
      setQuestion(questions[newIndex].question);

      // Reset
      setIsCorrect(false);
      setSuccessMessage("");
      setErrorMessage("");
      setUserAnswer("");

      // 2->3 => PNG kopyala
      if (newIndex === 2) {
        copyImage();
      }
    } else {
      // All questions are finished
      setQuestion("Congratulations! You've completed all the puzzles.");
      setSuccessMessage("");
      setIsCorrect(false);
    }
  };

  // Maze (soru 4) tamamlanınca
  const handleMazeComplete = () => {
    setIsCorrect(true);
    setSuccessMessage("Soruyu doğru bildin!");
  };

  const skipQuestion = () => {
    nextPuzzle();
  };

  // Hangisi labirent?
  const isMaze = questions[currentQuestionIndex].inputType === "maze";

  // App bileşeninin son kısmını güncelleyin
return (
  <div
    className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center"
    style={{
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    {/* DevMode Toggle - only show if devModeAvailable is true */}
    {devModeAvailable && (
      <button
        onClick={toggleDevMode}
        className="fixed top-4 right-4 bg-purple-600 hover:bg-purple-700 p-2 rounded-md z-50"
      >
        {devMode ? "DevMode: ON" : "DevMode: OFF"}
      </button>
    )}

    {/* DEV MODE PANEL - only show if devModeAvailable and devMode are both true */}
    {devModeAvailable && devMode && (
      <div className="fixed top-16 right-4 bg-gray-700 p-3 rounded-md z-50 w-64">
        <h2 className="font-semibold mb-2">Dev Panel</h2>
        <button
          onClick={skipQuestion}
          className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-md text-white w-full mb-2"
        >
          Skip Question
        </button>
        {isMaze && (
          <>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={enableRotation}
                onChange={(e) => setEnableRotation(e.target.checked)}
                className="mr-2"
                
              />
              <span>Dönme Açık/Kapalı</span>
            </div>

            <div className="flex space-x-2 mb-2">
              <div>
                <label className="text-sm">Min Delay (sn):</label>
                <input
                  type="number"
                  value={rotationMin}
                  onChange={(e) => setRotationMin(Number(e.target.value))}
                  className="w-14 ml-1 text-black p-1 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Max Delay (sn):</label>
                <input
                  type="number"
                  value={rotationMax}
                  onChange={(e) => setRotationMax(Number(e.target.value))}
                  className="w-14 ml-1 text-black p-1 rounded"
                />
              </div>
            </div>

            <div>
              <label className="text-sm">Yol Değiştirme (ms):</label>
              <input
                type="number"
                value={mapChangeInterval}
                onChange={(e) => setMapChangeInterval(Number(e.target.value))}
                className="w-20 ml-1 text-black p-1 rounded"
              />
            </div>
          </>
        )}
      </div>
    )}

    {isMaze ? (
      // ========== 4. Soru: Maze ==========
      <div className="min-h-screen flex flex-col items-center justify-center">
        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

        <p className="text-lg mb-4">{question}</p>

        {!isCorrect ? (
          <MazeGame
            onComplete={handleMazeComplete}
            enableRotation={enableRotation}
            rotationMin={rotationMin}
            rotationMax={rotationMax}
            mapChangeInterval={mapChangeInterval}
          />
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-green-300">{successMessage}</p>
            <button
              onClick={nextPuzzle}
              className="bg-green-500 hover:bg-green-600 p-2 rounded-md text-white w-full max-w-xs"
            >
              Next Puzzle
            </button>
          </div>
        )}
      </div>
    ) : questions[currentQuestionIndex].inputType === "morse" ? (
      <div className="min-h-screen flex flex-col items-center justify-center">
        {!isCorrect ? (
          <MorseCodeGame onComplete={handleMazeComplete} />
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-green-300">{successMessage}</p>
          </div>
        )}
      </div>
    ) : (
      // ========== Diğer Sorular (0,1,2) ==========
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg w-4/5 max-w-4xl flex items-start z-20">
          <div className="flex flex-col items-start w-full">
            <h1 className="text-2xl font-bold mb-4">Escape Game</h1>

            {errorMessage && (
              <p className="text-red-500 mb-4">{errorMessage}</p>
            )}

            <p className="text-lg mb-4">{question}</p>

            {!isCorrect ? (
              <>
                {questions[currentQuestionIndex].requiresInput && (
                  <>
                    <label htmlFor="answer-input" className="sr-only">
                      {questions[currentQuestionIndex].inputType === "file"
                        ? "Dosya ismi"
                        : "Cevap"}
                    </label>
                    <input
                      autoComplete="off" // Otomatik tamamlamayı devre dışı bırak
                      id="answer-input"
                      name="answer-input"
                      type={
                        questions[currentQuestionIndex].inputType === "file"
                          ? "text"
                          : questions[currentQuestionIndex].inputType
                      }
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder={
                        questions[currentQuestionIndex].inputType === "file"
                          ? "Dosya ismini girin"
                          : "Cevabınızı girin"
                      }
                      className="p-2 mb-4 rounded bg-gray-700 text-white w-full"
                    />
                  </>
                )}

                <button
                  onClick={checkAnswer}
                  className="bg-blue-500 hover:bg-blue-600 p-2 rounded-md text-white w-full"
                >
                  Submit Answer
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-4 w-full">
                {/* Doğru Bildik -> successMessage ve Next Puzzle */}
                <p className="text-green-300">{successMessage}</p>

                <button
                  onClick={nextPuzzle}
                  className="bg-green-500 hover:bg-green-600 p-2 rounded-md text-white w-full"
                >
                  Next Puzzle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Tüm soruları doğru yanıtladığında gösterilecek mesaj */}
    {currentQuestionIndex === questions.length - 1 && isCorrect && (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 p-6 rounded-lg shadow-lg z-50">
        <p className="text-white text-2xl font-bold">Tüm soruları doğru yanıtladın! Kameramandan kapıyı açmasını iste :)</p>
      </div>
    )}
  </div>
);
}

