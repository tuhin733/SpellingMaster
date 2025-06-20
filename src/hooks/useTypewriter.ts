import { useState, useEffect } from "react";

export const useTypewriter = (text: string, delay: number = 150) => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (!done) {
      setDone(true);
    }
    // Do nothing after done
  }, [currentIndex, text, delay, done]);

  // Reset if text changes
  useEffect(() => {
    setCurrentText("");
    setCurrentIndex(0);
    setDone(false);
  }, [text]);

  return currentText;
};
