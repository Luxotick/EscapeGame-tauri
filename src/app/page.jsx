"use client"; 
import { useState, useEffect } from "react"; 
import { invoke } from "@tauri-apps/api/core"; 

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
      question: "Üçüncü soru... Bu seferde belgeler içerisindeki bir png dosyasının içeriğine bir kelime gizledik onu bulabilir misin? Renk ayarlarıyla oynamayı düşünebilirsin :==)", 
      correctAnswer: "dayıoğlu", 
      requiresInput: true, 
      inputType: "text", 
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
    const currentQuestion = questions[currentQuestionIndex]; 

    if (currentQuestion.requiresInput) { 
      if (userAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()) { 
        setIsCorrect(true); 
        setQuestion("Tebrikler! Soruyu bildiniz."); 
      } else { 
        setErrorMessage("Cevabınız yanlış, tekrar deneyin."); 
      } 
    } else { 
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

  const nextPuzzle = () => { 
    if (currentQuestionIndex < questions.length - 1) { 
      setCurrentQuestionIndex(currentQuestionIndex + 1); 
      setIsCorrect(false); 
      setUserAnswer(""); 
      setQuestion(questions[currentQuestionIndex + 1].question);
      console.log(currentQuestionIndex); 
      if (currentQuestionIndex === 1) { 
        console.log("Copying image...");
        copyImage(); 
      }
    } else { 
      setQuestion("Tebrikler! Tüm soruları doğru bildiniz."); 
    } 
  };

  const currentQuestion = questions[currentQuestionIndex];

  return ( 
    <div 
      className="min-h-screen text-white flex justify-center items-center relative" 
      style={{ backgroundImage: 'url("/image.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}
    > 

      {/* Centered Mascot, Positioned Behind Content */}
      <img 
        src="/mascot.png" 
        alt="Mascot" 
        className="absolute top-1/2 ml-0 transform -translate-y-1/2 w-50 h-50 z-10" 
      />

      {/* Question Box with Mascot Inside and Left-Aligned Content */}
      <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg w-4/5 max-w-4xl flex items-start space-x-8 z-20"> 

        {/* Question Content */}
        <div className="flex flex-col items-start w-full"> 
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
                className="p-2 mb-4 rounded bg-gray-700 text-white w-full" 
              /> 
            ) : ( 
              <input 
                type={currentQuestion.inputType} 
                value={userAnswer} 
                onChange={(e) => setUserAnswer(e.target.value)} 
                placeholder="Cevabınızı girin" 
                className="p-2 mb-4 rounded bg-gray-700 text-white w-full" 
              /> 
            ) 
          )}

          {!isCorrect ? ( 
            <button 
              onClick={checkAnswer} 
              className="bg-blue-500 hover:bg-blue-600 p-2 rounded-md text-white w-full" 
            > 
              Submit Answer 
            </button> 
          ) : ( 
            <button 
              onClick={nextPuzzle} 
              className="bg-green-500 hover:bg-green-600 p-2 rounded-md text-white w-full" 
            > 
              Next Puzzle 
            </button> 
          )} 
        </div>
      </div>
    </div> 
  ); 
}
