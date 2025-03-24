//===========================================================
// WORKING VERSION
//===========================================================

// import React, { useState, useRef, useEffect } from "react";
// import "./ChatbotPopup.css"; // Import the CSS file
// import { IoChatbubbleEllipsesOutline, IoClose } from "react-icons/io5";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";


// // Function to replace Markdown-like syntax with simple HTML
// const formatMessage = (text) => {
//   return text
//     .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold **text**
//     .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italics *text*
//     .replace(/(?:\r\n|\r|\n)/g, "<br>") // New lines
//     .replace(/- (.*?)(?:\r\n|\r|\n|$)/g, "<li>$1</li>"); // Lists (- Item)
// };


// const App = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { sender: "bot", text: "Hi 👋 How can I help you?" },
//   ]);
//   const [input, setInput] = useState("");

//   const messagesEndRef = useRef(null); // Ref for auto-scrolling

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const toggleChat = () => setIsOpen(!isOpen);

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const userMessage = { sender: "user", text: input };
//     setMessages((prev) => [...prev, userMessage]);

//     try {
//       const response = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: input }),
//       });
//       const data = await response.json();
//       const botMessage = { sender: "bot", text: data.response };

//       setMessages((prev) => [...prev, botMessage]);
//     } catch (error) {
//       console.error("Error:", error);
//     }

//     setInput("");
//   };

//   return (
//     <div className="chatbot-container">
//       {/* Chat Button */}
//       {!isOpen && (
//         <button className="chat-button" onClick={toggleChat}>
//           <IoChatbubbleEllipsesOutline />
//         </button>
//       )}

//       {/* Chat Window */}
//       {isOpen && (
//         <div className="chat-window">
//           {/* Header */}
//           <div className="chat-header">
//             <span>Chat with FitBot</span>
//             <button className="close-button" onClick={toggleChat}>
//               <IoClose />
//             </button>
//           </div>

//           {/* Messages */}
//           <div className="chat-messages">
//             {messages.map((msg, index) => (
//               <div key={index} className={`chat-bubble ${msg.sender}`}>
//                   <ReactMarkdown>
//                     {msg.text}
//                   </ReactMarkdown>
//               </div>
//             ))}
//             <div ref={messagesEndRef} /> {/* Invisible div to auto-scroll <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />*/}
//           </div>

//           {/* Input Box */}
//           <div className="chat-input">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type a message..."
//               onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//             />
//             <button className="send-button" onClick={sendMessage}>
//               Send
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;


// // KIND OF WOKRING VERSION
// //===========================================================
// import React, { useState, useRef, useEffect } from "react";
// import "./ChatbotPopup.css"; 
// import { IoChatbubbleEllipsesOutline, IoClose, IoMic } from "react-icons/io5";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// // Function to recognize speech
// const recognizeSpeech = async (setInput, sendMessage) => {
//   try {
//     const recognition = new window.webkitSpeechRecognition();
//     recognition.lang = "en-US";

//     recognition.onstart = () => console.log("Listening...");
//     recognition.onresult = (event) => {
//       const transcript = event.results[0][0].transcript;
//       console.log("Recognized:", transcript);
//       setInput(transcript);
//       sendMessage(transcript);
//     };

//     recognition.onerror = (event) => console.error("Speech recognition error:", event);
//     recognition.start();
//   } catch (error) {
//     console.error("Speech recognition not supported", error);
//   }
// };

// const App = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([{ sender: "bot", text: "Hi 👋 How can I help you?" }]);
//   const [input, setInput] = useState("");
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const toggleChat = () => setIsOpen(!isOpen);

//   const sendMessage = async (text) => {
//     if (!text.trim()) return;

//     const userMessage = { sender: "user", text };
//     setMessages((prev) => [...prev, userMessage]);

//     try {
//       const response = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text }),
//       });

//       const data = await response.json();
//       const botMessage = { sender: "bot", text: data.response };

//       setMessages((prev) => [...prev, botMessage]);
//     } catch (error) {
//       console.error("Error:", error);
//     }

//     setInput("");
//   };

//   return (
//     <div className="chatbot-container">
//       {/* Chat Button */}
//       {!isOpen && (
//         <button className="chat-button" onClick={toggleChat}>
//           <IoChatbubbleEllipsesOutline />
//         </button>
//       )}

//       {/* Chat Window */}
//       {isOpen && (
//         <div className="chat-window">
//           {/* Header */}
//           <div className="chat-header">
//             <span>Chat with FitBot</span>
//             <button className="close-button" onClick={toggleChat}>
//               <IoClose />
//             </button>
//           </div>

//           {/* Messages */}
//           <div className="chat-messages">
//             {messages.map((msg, index) => (
//               <div key={index} className={`chat-bubble ${msg.sender}`}>
//                 <ReactMarkdown>{msg.text}</ReactMarkdown>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>

//           {/* Input Box */}
//           <div className="chat-input">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type a message..."
//               onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
//             />
//             <button className="send-button" onClick={() => sendMessage(input)}>
//               Send
//             </button>
//             <button className="mic-button" onClick={() => recognizeSpeech(setInput, sendMessage)}>
//               <IoMic />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;


// ===========================================================
// WHISPER REACT
// ===========================================================
// import React, { useState, useRef, useEffect } from "react";
// import "./ChatbotPopup.css";
// import { IoChatbubbleEllipsesOutline, IoClose, IoMic, IoMicOff } from "react-icons/io5";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// const App = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { sender: "bot", text: "Hi 👋 How can I help you with your fitness journey today? Try speaking to me!" },
//   ]);
//   const [input, setInput] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingStatus, setRecordingStatus] = useState("");
//   const messagesEndRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const toggleChat = () => setIsOpen(!isOpen);

//   const sendMessage = async () => {
//     if (!input.trim()) return;
//     const userMessage = { sender: "user", text: input };
//     setMessages((prev) => [...prev, userMessage]);
    
//     try {
//       const response = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: input }),
//       });
//       const data = await response.json();
//       const botMessage = { sender: "bot", text: data.response };
//       setMessages((prev) => [...prev, botMessage]);
//     } catch (error) {
//       console.error("Error:", error);
//       setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that request." }]);
//     }
    
//     setInput("");
//   };

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       audioChunksRef.current = [];
      
//       const mediaRecorder = new MediaRecorder(stream);
//       mediaRecorderRef.current = mediaRecorder;
      
//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };
      
//       mediaRecorder.onstop = async () => {
//         setRecordingStatus("Processing speech...");
//         const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
//         await sendAudioToWhisper(audioBlob);
//         setRecordingStatus("");
//       };
      
//       mediaRecorder.start();
//       setIsRecording(true);
//       setRecordingStatus("Listening...");
//     } catch (error) {
//       console.error("Error accessing microphone:", error);
//       setRecordingStatus("Microphone access denied");
//       setTimeout(() => setRecordingStatus(""), 3000);
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
//       setIsRecording(false);
//     }
//   };

//   const sendAudioToWhisper = async (audioBlob) => {
//     try {
//       const formData = new FormData();
//       formData.append("audio", audioBlob, "recording.webm");
      
//       const response = await fetch("http://localhost:5000/transcribe", {
//         method: "POST",
//         body: formData,
//       });
      
//       const data = await response.json();
//       if (data.text) {
//         setInput(data.text);
//         // Automatically send the transcribed message
//         const userMessage = { sender: "user", text: data.text };
//         setMessages((prev) => [...prev, userMessage]);
        
//         const chatResponse = await fetch("http://localhost:5000/chat", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ message: data.text }),
//         });
        
//         const chatData = await chatResponse.json();
//         const botMessage = { sender: "bot", text: chatData.response };
//         setMessages((prev) => [...prev, botMessage]);
//         setInput("");
//       } else {
//         setRecordingStatus("Couldn't understand audio. Please try again.");
//         setTimeout(() => setRecordingStatus(""), 3000);
//       }
//     } catch (error) {
//       console.error("Error processing audio:", error);
//       setRecordingStatus("Error processing speech");
//       setTimeout(() => setRecordingStatus(""), 3000);
//     }
//   };

//   return (
//     <div className="chatbot-container">
//       {/* Chat Button */}
//       {!isOpen && (
//         <button className="chat-button" onClick={toggleChat}>
//           <IoChatbubbleEllipsesOutline />
//         </button>
//       )}
      
//       {/* Chat Window */}
//       {isOpen && (
//         <div className="chat-window">
//           {/* Header */}
//           <div className="chat-header">
//             <span>Chat with FitBot</span>
//             <button className="close-button" onClick={toggleChat}>
//               <IoClose />
//             </button>
//           </div>
          
//           {/* Messages */}
//           <div className="chat-messages">
//             {messages.map((msg, index) => (
//               <div key={index} className={`chat-bubble ${msg.sender}`}>
//                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                   {msg.text}
//                 </ReactMarkdown>
//               </div>
//             ))}
//             {recordingStatus && (
//               <div className="recording-status">
//                 {recordingStatus}
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>
          
//           {/* Input Box */}
//           <div className="chat-input">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type a message or click mic to speak..."
//               onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//             />
//             <button 
//               className={`mic-button ${isRecording ? 'recording' : ''}`} 
//               onClick={isRecording ? stopRecording : startRecording}
//             >
//               {isRecording ? <IoMicOff /> : <IoMic />}
//             </button>
//             <button className="send-button" onClick={sendMessage}>
//               Send
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;

//===========================================================
// WORKING VERSION: Voice works ONLY ON CHROME/Safari
//===========================================================

// import React, { useState, useRef, useEffect } from "react";
// import "./ChatbotPopup.css";
// import { IoChatbubbleEllipsesOutline, IoClose, IoMic, IoMicOff } from "react-icons/io5";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// const App = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { sender: "bot", text: "Hi 👋 How can I help you with your fitness journey today? Try speaking to me!" },
//   ]);
//   const [input, setInput] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingStatus, setRecordingStatus] = useState("");
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Initialize speech recognition
//   useEffect(() => {
//     // Check if SpeechRecognition is available
//     window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
//     if (!window.SpeechRecognition) {
//       console.error("Speech recognition not supported by this browser");
//       return;
//     }
    
//     const recognition = new window.SpeechRecognition();
//     recognition.continuous = false;
//     recognition.interimResults = true;
//     recognition.lang = 'en-US';
    
//     recognition.onstart = () => {
//       setIsRecording(true);
//       setRecordingStatus("Listening...");
//     };
    
//     recognition.onresult = (event) => {
//       const transcript = Array.from(event.results)
//         .map(result => result[0])
//         .map(result => result.transcript)
//         .join('');
      
//       setInput(transcript);
      
//       // If this is a final result, not an interim one
//       if (event.results[0].isFinal) {
//         setRecordingStatus("Processing...");
//       }
//     };
    
//     recognition.onend = () => {
//       setIsRecording(false);
//       setRecordingStatus("");
      
//       // If there's a transcript, send the message
//       if (input.trim()) {
//         handleSpeechResult(input);
//       } else {
//         setRecordingStatus("No speech detected. Try again.");
//         setTimeout(() => setRecordingStatus(""), 3000);
//       }
//     };
    
//     recognition.onerror = (event) => {
//       console.error("Speech recognition error:", event.error);
//       setIsRecording(false);
//       setRecordingStatus(`Error: ${event.error}`);
//       setTimeout(() => setRecordingStatus(""), 3000);
//     };
    
//     recognitionRef.current = recognition;
    
//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.abort();
//       }
//     };
//   }, []);

//   const toggleChat = () => setIsOpen(!isOpen);

//   const sendMessage = async () => {
//     if (!input.trim()) return;
//     const userMessage = { sender: "user", text: input };
//     setMessages((prev) => [...prev, userMessage]);
    
//     try {
//       const response = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: input }),
//       });
//       const data = await response.json();
//       const botMessage = { sender: "bot", text: data.response };
//       setMessages((prev) => [...prev, botMessage]);
//     } catch (error) {
//       console.error("Error:", error);
//       setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that request." }]);
//     }
    
//     setInput("");
//   };

//   const startRecording = () => {
//     if (recognitionRef.current) {
//       recognitionRef.current.start();
//     } else {
//       setRecordingStatus("Speech recognition not available");
//       setTimeout(() => setRecordingStatus(""), 3000);
//     }
//   };

//   const stopRecording = () => {
//     if (recognitionRef.current && isRecording) {
//       recognitionRef.current.stop();
//     }
//   };

//   const handleSpeechResult = async (text) => {
//     // Send the transcribed text to the server
//     try {
//       const userMessage = { sender: "user", text };
//       setMessages((prev) => [...prev, userMessage]);
      
//       const chatResponse = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text }),
//       });
      
//       const chatData = await chatResponse.json();
//       const botMessage = { sender: "bot", text: chatData.response };
//       setMessages((prev) => [...prev, botMessage]);
//       setInput("");
//     } catch (error) {
//       console.error("Error processing speech:", error);
//       setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that request." }]);
//     }
//   };

//   return (
//     <div className="chatbot-container">
//       {/* Chat Button */}
//       {!isOpen && (
//         <button className="chat-button" onClick={toggleChat}>
//           <IoChatbubbleEllipsesOutline />
//         </button>
//       )}
      
//       {/* Chat Window */}
//       {isOpen && (
//         <div className="chat-window">
//           {/* Header */}
//           <div className="chat-header">
//             <span>Chat with FitBot</span>
//             <button className="close-button" onClick={toggleChat}>
//               <IoClose />
//             </button>
//           </div>
          
//           {/* Messages */}
//           <div className="chat-messages">
//             {messages.map((msg, index) => (
//               <div key={index} className={`chat-bubble ${msg.sender}`}>
//                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                   {msg.text}
//                 </ReactMarkdown>
//               </div>
//             ))}
//             {recordingStatus && (
//               <div className="recording-status">
//                 {recordingStatus}
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>
          
//           {/* Input Box */}
//           <div className="chat-input">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type a message or click mic to speak..."
//               onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//             />
//             <button 
//               className={`mic-button ${isRecording ? 'recording' : ''}`} 
//               onClick={isRecording ? stopRecording : startRecording}
//             >
//               {isRecording ? <IoMicOff /> : <IoMic />}
//             </button>
//             <button className="send-button" onClick={sendMessage}>
//               Send
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;

//============================================================

import React, { useState, useRef, useEffect } from "react";
import "./ChatbotPopup.css";
import { IoChatbubbleEllipsesOutline, IoClose, IoMic, IoMicOff, IoVolumeHigh } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


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

  // Fetch user's name when chat opens
  // Inside your fetch in useEffect
useEffect(() => {
  if (isOpen && messages.length === 0) {
    fetch("http://localhost:5000/user_name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 72 }) // Replace with dynamic ID later
    })
      .then(res => res.json())
      .then(data => {
        const name = data.first_name;
        setUserName(name);
        setMessages([
          {
            sender: "bot",
            text: `Hi ${name} 👋 How can I help you with your fitness journey today?`
          }
        ]);
      })
      .catch(err => {
        console.error("Failed to fetch name:", err);
        setMessages([
          { sender: "bot", text: "Hi 👋 How can I help you with your fitness journey today?" }
        ]);
      });
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
  
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input
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
      
      const chatResponse = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
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
            <span>Chat with FitBot</span>
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


// import React, { useState, useRef, useEffect } from "react";
// import "./ChatbotPopup.css";
// import { 
//   IoChatbubbleEllipsesOutline, 
//   IoClose, 
//   IoMic, 
//   IoMicOff,
//   IoVolumeHigh,
//   IoVolumeMute 
// } from "react-icons/io5";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// const App = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { sender: "bot", text: "Hi 👋 How can I help you with your fitness journey today? Try speaking to me!" },
//   ]);
//   const [input, setInput] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingStatus, setRecordingStatus] = useState("");
//   const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const speechSynthesisRef = useRef(null);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
//     // If speech is enabled and the last message is from the bot, speak it
//     const lastMessage = messages[messages.length - 1];
//     if (isSpeechEnabled && lastMessage && lastMessage.sender === "bot") {
//       speakText(lastMessage.text);
//     }
//   }, [messages, isSpeechEnabled]);

//   // Initialize speech recognition
//   useEffect(() => {
//     // Check if SpeechRecognition is available
//     window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
//     if (!window.SpeechRecognition) {
//       console.error("Speech recognition not supported by this browser");
//       return;
//     }
    
//     const recognition = new window.SpeechRecognition();
//     recognition.continuous = false;
//     recognition.interimResults = true;
//     recognition.lang = 'en-US';
    
//     recognition.onstart = () => {
//       setIsRecording(true);
//       setRecordingStatus("Listening...");
//     };
    
//     recognition.onresult = (event) => {
//       const transcript = Array.from(event.results)
//         .map(result => result[0])
//         .map(result => result.transcript)
//         .join('');
      
//       setInput(transcript);
      
//       // If this is a final result, not an interim one
//       if (event.results[0].isFinal) {
//         setRecordingStatus("Processing...");
//       }
//     };
    
//     recognition.onend = () => {
//       setIsRecording(false);
//       setRecordingStatus("");
      
//       // If there's a transcript, send the message
//       if (input.trim()) {
//         handleSpeechResult(input);
//       } else {
//         setRecordingStatus("No speech detected. Try again.");
//         setTimeout(() => setRecordingStatus(""), 3000);
//       }
//     };
    
//     recognition.onerror = (event) => {
//       console.error("Speech recognition error:", event.error);
//       setIsRecording(false);
//       setRecordingStatus(`Error: ${event.error}`);
//       setTimeout(() => setRecordingStatus(""), 3000);
//     };
    
//     recognitionRef.current = recognition;
    
//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.abort();
//       }
      
//       // Cancel any ongoing speech when component unmounts
//       if (window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//     };
//   }, []);

//   // Text-to-speech function
//   const speakText = (text) => {
//     // Cancel any ongoing speech
//     if (window.speechSynthesis) {
//       window.speechSynthesis.cancel();
      
//       // Clean text for speech (remove markdown and code blocks)
//       const cleanText = text
//         .replace(/```[^`]*```/g, "Code snippet removed for speech") // Remove code blocks
//         .replace(/`([^`]+)`/g, "$1") // Remove inline code formatting
//         .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold formatting
//         .replace(/\*([^*]+)\*/g, "$1") // Remove italic formatting
//         .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace links with just the text
//         .replace(/#{1,6}\s+(.+)/g, "$1"); // Remove headings

//       const utterance = new SpeechSynthesisUtterance(cleanText);
      
//       // Get available voices and try to select a good one
//       const voices = window.speechSynthesis.getVoices();
//       if (voices.length > 0) {
//         // Try to find a female English voice for better fitness coach experience
//         const preferredVoice = voices.find(voice => 
//           voice.lang.includes('en') && voice.name.includes('Female')
//         ) || 
//         // Fallback to any English voice
//         voices.find(voice => voice.lang.includes('en')) || 
//         // Or just use the first available voice
//         voices[0];
        
//         utterance.voice = preferredVoice;
//       }
      
//       // Set properties for better speech
//       utterance.rate = 1.0;  // Normal speed
//       utterance.pitch = 1.0; // Normal pitch
//       utterance.volume = 1.0; // Full volume
      
//       // Store reference to cancel if needed
//       speechSynthesisRef.current = utterance;
      
//       // Speak the text
//       window.speechSynthesis.speak(utterance);
//     }
//   };

//   // Toggle speech output
//   const toggleSpeech = () => {
//     const newState = !isSpeechEnabled;
//     setIsSpeechEnabled(newState);
    
//     // If enabling speech, speak the last bot message
//     if (newState) {
//       const botMessages = messages.filter(msg => msg.sender === "bot");
//       if (botMessages.length > 0) {
//         speakText(botMessages[botMessages.length - 1].text);
//       }
//     } else {
//       // If disabling speech, cancel any ongoing speech
//       if (window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//     }
//   };

//   const toggleChat = () => setIsOpen(!isOpen);

//   const sendMessage = async () => {
//     if (!input.trim()) return;
//     const userMessage = { sender: "user", text: input };
//     setMessages((prev) => [...prev, userMessage]);
    
//     // Stop any ongoing speech when user sends a message
//     if (window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }
    
//     try {
//       const response = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: input }),
//       });
//       const data = await response.json();
//       const botMessage = { sender: "bot", text: data.response };
//       setMessages((prev) => [...prev, botMessage]);
//     } catch (error) {
//       console.error("Error:", error);
//       setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that request." }]);
//     }
    
//     setInput("");
//   };

//   const startRecording = () => {
//     // Stop any ongoing speech when starting to record
//     if (window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }
    
//     if (recognitionRef.current) {
//       recognitionRef.current.start();
//     } else {
//       setRecordingStatus("Speech recognition not available");
//       setTimeout(() => setRecordingStatus(""), 3000);
//     }
//   };

//   const stopRecording = () => {
//     if (recognitionRef.current && isRecording) {
//       recognitionRef.current.stop();
//     }
//   };

//   const handleSpeechResult = async (text) => {
//     // Send the transcribed text to the server
//     try {
//       const userMessage = { sender: "user", text };
//       setMessages((prev) => [...prev, userMessage]);
      
//       const chatResponse = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text }),
//       });
      
//       const chatData = await chatResponse.json();
//       const botMessage = { sender: "bot", text: chatData.response };
//       setMessages((prev) => [...prev, botMessage]);
//       setInput("");
//     } catch (error) {
//       console.error("Error processing speech:", error);
//       setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that request." }]);
//     }
//   };

//   // Handle voices loading (needed especially for Chrome)
//   useEffect(() => {
//     if (window.speechSynthesis) {
//       // Load voices
//       const loadVoices = () => {
//         window.speechSynthesis.getVoices();
//       };
      
//       // Chrome needs this event listener
//       if (window.speechSynthesis.onvoiceschanged !== undefined) {
//         window.speechSynthesis.onvoiceschanged = loadVoices;
//       }
      
//       // Initial load of voices
//       loadVoices();
//     }
//   }, []);

//   return (
//     <div className="chatbot-container">
//       {/* Chat Button */}
//       {!isOpen && (
//         <button className="chat-button" onClick={toggleChat}>
//           <IoChatbubbleEllipsesOutline />
//         </button>
//       )}
      
//       {/* Chat Window */}
//       {isOpen && (
//         <div className="chat-window">
//           {/* Header */}
//           <div className="chat-header">
//             <span>Chat with FitBot</span>
//             <div className="header-buttons">
//               <button 
//                 className={`speech-toggle ${isSpeechEnabled ? 'active' : ''}`} 
//                 onClick={toggleSpeech}
//                 aria-label={isSpeechEnabled ? "Disable speech" : "Enable speech"}
//                 title={isSpeechEnabled ? "Disable speech" : "Enable speech"}
//               >
//                 {isSpeechEnabled ? <IoVolumeHigh /> : <IoVolumeMute />}
//               </button>
//               <button className="close-button" onClick={toggleChat}>
//                 <IoClose />
//               </button>
//             </div>
//           </div>
          
//           {/* Messages */}
//           <div className="chat-messages">
//             {messages.map((msg, index) => (
//               <div key={index} className={`chat-bubble ${msg.sender}`}>
//                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                   {msg.text}
//                 </ReactMarkdown>
//                 {msg.sender === "bot" && (
//                   <button 
//                     className="speak-message-button" 
//                     onClick={() => speakText(msg.text)}
//                     aria-label="Speak this message"
//                     title="Speak this message"
//                   >
//                     <IoVolumeHigh size={14} />
//                   </button>
//                 )}
//               </div>
//             ))}
//             {recordingStatus && (
//               <div className="recording-status">
//                 {recordingStatus}
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>
          
//           {/* Input Box */}
//           <div className="chat-input">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type a message or click mic to speak..."
//               onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//             />
//             <button 
//               className={`mic-button ${isRecording ? 'recording' : ''}`} 
//               onClick={isRecording ? stopRecording : startRecording}
//             >
//               {isRecording ? <IoMicOff /> : <IoMic />}
//             </button>
//             <button className="send-button" onClick={sendMessage}>
//               Send
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;