import React, { useState, useRef, useEffect } from "react";
import "./ChatbotPopup.css";
import { IoChatbubbleEllipsesOutline, IoClose, IoMic, IoMicOff, IoVolumeHigh } from "react-icons/io5";
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
  const [personalityMode, setPersonalityMode] = useState("chill");


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
  

  // Fetch user's name when chat opens
  // Inside your fetch in useEffect
// useEffect(() => {
//   if (isOpen && messages.length === 0) {
//     fetch("http://localhost:5000/user_name", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ user_id: 1 }) // Replace with dynamic ID later
//     })
//       .then(res => res.json())
//       .then(data => {
//         const name = data.first_name;
//         setUserName(name);
//         setMessages([
//           {
//             sender: "bot",
//             text: `Hi ${name} 👋 How can I help you with your fitness journey today?`
//           }
//         ]);
//       })
//       .catch(err => {
//         console.error("Failed to fetch name:", err);
//         setMessages([
//           { sender: "bot", text: "Hi 👋 How can I help you with your fitness journey today?" }
//         ]);
//       });
//   }
// }, [isOpen]);

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



  // Initialize speech recognition
  useEffect(() => {
    // Check if SpeechRecognition is available
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
      console.error("Speech recognition not supported by this browser");
      return;
    }
    
    const recognition = new window.SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    setupRecognitionHandlers(recognition);
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      // Cancel any ongoing speech when component unmounts
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
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
      
      // If this is a final result, not an interim one
      if (event.results[0].isFinal) {
        setRecordingStatus("Processing...");
      }
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      setRecordingStatus("");
      
      // If there's a transcript, send the message
      if (input.trim()) {
        handleSpeechResult(input);
      } else {
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

  // DEVELOPMENTAL VERSION
  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    // 🔐 Get username and user ID
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
        body: JSON.stringify({
          message: input,
          user_id: userId,
          personality_mode: personalityMode
        }),
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
  
  // WORKING VERSION 3/23/25
  // const sendMessage = async () => {
  //   if (!input.trim()) return;
  //   const userMessage = { sender: "user", text: input };
  //   setMessages((prev) => [...prev, userMessage]);
    
  //   try {
  //     const response = await fetch("http://localhost:5000/chat", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ message: input }),
  //     });
  //     const data = await response.json();
  //     const botMessage = { sender: "bot", text: data.response };
  //     setMessages((prev) => [...prev, botMessage]);
      
  //     // Auto-play the bot's response as speech
  //     speakText(data.response);
  //   } catch (error) {
  //     console.error("Error:", error);
  //     setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that request." }]);
  //   }
    
  //   setInput("");
  // };

  const startRecording = () => {
    // Cancel any ongoing speech when starting a new recording
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    // For better iOS compatibility
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        // Re-attach event handlers
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
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const handleSpeechResult = async (text) => {
    // Send the transcribed text to the server
    try {
      const userMessage = { sender: "user", text };
      setMessages((prev) => [...prev, userMessage]);

      const username = getUsernameFromStorage();
      const userId = username ? await getUserId(username) : null;

      
      const chatResponse = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          user_id: userId, 
          personality_mode: personalityMode 
        }),
      });
      
      const chatData = await chatResponse.json();
      const botMessage = { sender: "bot", text: chatData.response };
      setMessages((prev) => [...prev, botMessage]);
      
      // Auto-play the bot's response
      speakText(chatData.response);
      
      setInput("");
    } catch (error) {
      console.error("Error processing speech:", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that request." }]);
    }
  };

  // Function to speak text, ignoring emojis
  const speakText = (text) => {
    if (!speechSynthesisRef.current) return;
    
    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();
    
    // Remove emojis from text using regex
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set voice properties (optional)
    utterance.rate = 1.0;  // Speed
    utterance.pitch = 1.0; // Pitch
    utterance.volume = 1.0; // Volume
    
    // Optional: Select a voice (if available)
    const voices = speechSynthesisRef.current.getVoices();
    if (voices.length > 0) {
      // Try to find a good English voice
      const preferredVoice = voices.find(voice => 
        (voice.name.includes('Female') || voice.name.includes('Google')) && 
        voice.lang.includes('en-')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }
    
    // Speak the text
    speechSynthesisRef.current.speak(utterance);
  };

  // Function to speak a specific message when its audio button is clicked
  const speakMessage = (messageText) => {
    speakText(messageText);
  };

  return (
    <div className="chatbot-container">
      {/* Chat Button */}
      {!isOpen && (
        <button className="chat-button" onClick={toggleChat}>
          <IoChatbubbleEllipsesOutline />
        </button>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <span>FitBot</span>
            <button className="close-button" onClick={toggleChat}>
              <IoClose />
            </button>
          </div>
          
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-bubble ${msg.sender}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
                
                {/* Add audio playback button for bot messages */}
                {msg.sender === "bot" && (
                  <button 
                    className="speak-button" 
                    onClick={() => speakMessage(msg.text)}
                    aria-label="Read message aloud"
                  >
                    <IoVolumeHigh />
                  </button>
                )}
              </div>
            ))}
            {recordingStatus && (
              <div className="recording-status">
                {recordingStatus}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Personality Selector */}
          <div className="personality-selector" style={{ padding: "0 1rem 0.5rem" }}>
            <label htmlFor="mode" style={{ marginRight: "0.5rem" }}>Mode:</label>
            <select 
              id="mode" 
              value={personalityMode}
              onChange={(e) => setPersonalityMode(e.target.value)}
            >
              <option value="bully">Drill Sergeant 💀</option>
              <option value="chill">Personal Trainer 🧘</option>
              <option value="science-based">Science-Based 🧪</option>
            </select>
          </div>
          {/* Input Box */}
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message or click mic to speak..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button 
              className={`mic-button ${isRecording ? 'recording' : ''}`} 
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <IoMicOff /> : <IoMic />}
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

//===========================================================