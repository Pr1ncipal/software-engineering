import React, { useState, useRef, useEffect } from "react";
import "./ChatbotPopup.css";
import { Ionicons } from "@expo/vector-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getUserId } from "../utils/getUserId"; // adjust path if needed

const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [userName, setUserName] = useState("");
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function getUsernameFromStorage() {
    const encoded = localStorage.getItem("savedUsername");
    if (!encoded) return null;
    try {
      const decoded = atob(encoded);
      const parsed = JSON.parse(decoded);
      return parsed.value;
    } catch (e) {
      console.error("Failed to decode user from localStorage", e);
      return null;
    }
  }

  useEffect(() => {
    const loadGreeting = async () => {
      const username = getUsernameFromStorage();
      const userId = username ? await getUserId(username) : null;
      if (!userId) {
        setMessages([{ sender: "bot", text: "Hi 👋 How can I help you with your fitness journey today?" }]);
        return;
      }
      fetch("http://localhost:5000/user_name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      })
        .then(res => res.json())
        .then(data => {
          const name = data.first_name;
          setUserName(name);
          setMessages([
            { sender: "bot", text: `Hi ${name} 👋 How can I help you with your fitness journey today?` }
          ]);
        })
        .catch(err => {
          console.error("Name fetch error:", err);
          setMessages([{ sender: "bot", text: "Hi 👋 How can I help you with your fitness journey today?" }]);
        });
    };
    if (isOpen && messages.length === 0) {
      loadGreeting();
    }
  }, [isOpen]);

  useEffect(() => {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.SpeechRecognition) return;
    const recognition = new window.SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    setupRecognitionHandlers(recognition);
    recognitionRef.current = recognition;
    return () => {
      recognitionRef.current?.abort();
      speechSynthesisRef.current?.cancel();
    };
  }, []);

  const setupRecognitionHandlers = (recognition) => {
    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingStatus("Listening...");
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInput(transcript);
      if (event.results[0].isFinal) setRecordingStatus("Processing...");
    };
    recognition.onend = () => {
      setIsRecording(false);
      setRecordingStatus("");
      if (input.trim()) handleSpeechResult(input);
      else {
        setRecordingStatus("No speech detected. Try again.");
        setTimeout(() => setRecordingStatus(""), 3000);
      }
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      setRecordingStatus(`Error: ${event.error}`);
      setTimeout(() => setRecordingStatus(""), 3000);
    };
  };

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const username = getUsernameFromStorage();
    const userId = username ? await getUserId(username) : null;
    if (!userId) {
      setMessages(prev => [...prev, { sender: "bot", text: "❌ User ID not found." }]);
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, user_id: userId }),
      });
      const data = await response.json();
      const botMessage = { sender: "bot", text: data.response };
      setMessages((prev) => [...prev, botMessage]);
      speakText(data.response);
    } catch (error) {
      console.error("Error:", error);
    }
    setInput("");
  };

  const startRecording = () => {
    speechSynthesisRef.current?.cancel();
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        setupRecognitionHandlers(recognitionRef.current);
      } catch (error) {
        console.error("Error creating speech recognition instance:", error);
      }
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Speech recognition start error:", error);
        setRecordingStatus("Speech recognition failed to start");
        setTimeout(() => setRecordingStatus(""), 3000);
      }
    } else {
      setRecordingStatus("Speech recognition not available");
      setTimeout(() => setRecordingStatus(""), 3000);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) recognitionRef.current.stop();
  };

  const handleSpeechResult = async (text) => {
    try {
      const userMessage = { sender: "user", text };
      setMessages((prev) => [...prev, userMessage]);
      const chatResponse = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const chatData = await chatResponse.json();
      const botMessage = { sender: "bot", text: chatData.response };
      setMessages((prev) => [...prev, botMessage]);
      speakText(chatData.response);
      setInput("");
    } catch (error) {
      console.error("Error processing speech:", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that request." }]);
    }
  };

  const speakText = (text) => {
    if (!speechSynthesisRef.current) return;
    speechSynthesisRef.current.cancel();
    const cleanText = text.replace(/[^\p{L}\p{N}\p{P}\p{Z}^\n\r]/gu, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = speechSynthesisRef.current.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => (v.name.includes('Female') || v.name.includes('Google')) && v.lang.includes('en-'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }
    speechSynthesisRef.current.speak(utterance);
  };

  const speakMessage = (messageText) => speakText(messageText);

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <button className="chat-button" onClick={toggleChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
        </button>
      )}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>FitBot</span>
            <button className="close-button" onClick={toggleChat}>
              <Ionicons name="close" size={24} color="#fff" />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-bubble ${msg.sender}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                {msg.sender === "bot" && (
                  <button
                    className="speak-button"
                    onClick={() => speakMessage(msg.text)}
                    aria-label="Read message aloud"
                  >
                    <Ionicons name="volume-high-outline" size={20} color="#444" />
                  </button>
                )}
              </div>
            ))}
            {recordingStatus && <div className="recording-status">{recordingStatus}</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message or click mic to speak..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              className={`mic-button ${isRecording ? "recording" : ""}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Ionicons
                name={isRecording ? "mic-off-outline" : "mic-outline"}
                size={24}
                color={isRecording ? "#FF3B30" : "#007AFF"}
              />
            </button>
            <button className="send-button" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
