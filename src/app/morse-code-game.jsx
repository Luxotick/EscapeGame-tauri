import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Confetti from 'react-confetti';

const morseCode = {
  'k': '-.-', 'i': '..', 'c': '-.-.', 'o': '---', 'f': '..-.'
};

const word = "kickoff";

export function MorseCodeGame({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOn, setIsOn] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [completed, setCompleted] = useState(false); // Yeni state

  const playMorseCode = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    if (currentIndex < word.length) {
      const letter = word[currentIndex];
      const code = morseCode[letter];
      let timeouts = [];

      code.split('').forEach((signal, index) => {
        timeouts.push(setTimeout(() => {
          setIsOn(true);
          setTimeout(() => setIsOn(false), signal === '.' ? 200 : 600);
        }, index * 1000));
      });

      timeouts.push(setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, code.length * 1000 + 1000));

      return () => timeouts.forEach(clearTimeout);
    }
  }, [currentIndex]);

  const handleSubmit = () => {
    if (userInput.toLowerCase() === word) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setCompleted(true); // Oyun tamamlandı
        onComplete(); // onComplete çağrılır
      }, 3000); // Konfeti 3 saniye gösterildikten sonra onComplete çağrılır
    } else {
      alert('Incorrect! Try again.');
      setUserInput('');
    }
  };

  // Eğer oyun tamamlandıysa, bileşeni render etme
  if (completed) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {showConfetti && <Confetti />}
      <div className={`w-16 h-16 rounded-full ${isOn ? 'bg-yellow-400' : 'bg-gray-400'}`} />
      <Button onClick={playMorseCode}>Replay Morse Code</Button>
      <Input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Enter the decoded word"
        className="max-w-xs"
      />
      <Button onClick={handleSubmit}>Submit Answer</Button>
    </div>
  );
}