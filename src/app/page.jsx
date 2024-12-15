"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core"; // invoke'ı doğru import ettik

export default function App() {
  const questions = [
    {
      question: "İlk soruya hoş geldiniz.. Bu bilgisayar içindeki 'belgeler' klasöründe bir exe dosyası gizledik, dosyanın ismini türkçe karşılığı ile değiştirip submit answer tuşuna basın.",
      correctAnswer: "",
      requiresInput: false,
      inputType: "file",
    },
    {
      question: "İkinci soruya geçtiniz... Biraz da frc üzerinden gidelim, 9 eksenli teker modülünün ismi?",
      correctAnswer: "swerve",
      requiresInput: true,
      inputType: "text",
    },
    {
      question: "Üçüncü soru... Belgeler klasöründeki dosyaların adlarını listeleyin.",
      correctAnswer: "",
      requiresInput: false,
      inputType: "none",
    },
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [question, setQuestion] = useState(questions[0].question);

  useEffect(() => {
    const createFile = async () => {
      try {
        const result = await invoke("create_exe_file");
        console.log(`File created at: ${result}`);
      } catch (error) {
        console.error("Error creating file:", error);
        setErrorMessage("Dosya oluşturulurken bir hata oluştu.");
      }
    };

    createFile();
  }, []);

  const fileCheck = async () => {
    try {
      const result = await invoke("check_file_name");
      if (result) {
        setIsCorrect(true);
      } else {
        alert("w");
      }
    } catch (error) {
      console.error("Error checking file name:", error);
      setErrorMessage("Dosya adı kontrol edilirken bir hata oluştu.");
    }
  };

  const checkAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex]; // currentQuestion'ı doğru şekilde tanımlıyoruz

    if (currentQuestion.requiresInput) {
      if (userAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()) {
        setIsCorrect(true);
        setQuestion("Tebrikler! Soruyu bildiniz.");
      } else {
        setErrorMessage("Cevabınız yanlış, tekrar deneyin.");
      }
    }else{
      if (currentQuestion.inputType === "file") {
        try {
          const result = await invoke("check_file_name");
          if (result) {
            console.log("File name is correct.");
            setIsCorrect(true);
            setQuestion("Tebrikler! Soruyu bildiniz.");
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

  const nextPuzzle = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsCorrect(false);
      setUserAnswer("");
      setQuestion(questions[currentQuestionIndex + 1].question);
    } else {
      setQuestion("Tebrikler! Tüm soruları doğru bildiniz.");
    }
  };

  // questions[currentQuestionIndex] öğesinin undefined olma olasılığını kontrol etme
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-4/5 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Escape Game</h1>

        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

        <p className="text-lg mb-4">{question}</p>

        {currentQuestion && currentQuestion.requiresInput && (
          currentQuestion.inputType === "file" ? (
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Dosya ismini girin"
              className="p-2 mb-4 rounded bg-gray-700 text-white"
            />
          ) : (
            <input
              type={currentQuestion.inputType}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Cevabınızı girin"
              className="p-2 mb-4 rounded bg-gray-700 text-white"
            />
          )
        )}

        {!isCorrect ? (
          <button
            onClick={checkAnswer}
            className="bg-blue-500 hover:bg-blue-600 p-2 rounded-md text-white"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={nextPuzzle}
            className="bg-green-500 hover:bg-green-600 p-2 rounded-md text-white"
          >
            Next Puzzle
          </button>
        )}
      </div>
    </div>
  );
}
