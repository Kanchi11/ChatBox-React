import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FcOk } from "react-icons/fc";
import { IoCloseOutline, IoClose, IoMoon, IoSunny, IoCopy, IoDownload, IoMic, IoMicOff, IoVolumeHigh, IoVolumeOff } from "react-icons/io5";
import { FiPlus, FiThumbsUp, FiThumbsDown, FiUsers, FiSettings } from 'react-icons/fi';

interface StreamData {
    status?: string;
    token?: string;
    text?: string;
    type?: string;
    assistantMessageId?: string;
    conversationID?: string;
    message?: string;
    userMessageid?: string;
}

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'assistant' | 'system';
    timestamp: Date;
    reaction?: 'like' | 'dislike';
    persona?: string;
}

interface EditCard {
    cardId: string;
    oldText: string;
    newText: string;
}

type AIPersona = 'creative' | 'technical' | 'casual' | 'professional';

const ChatBox: React.FC = () => {
    // Core state
    const [streamData, setStreamData] = useState<StreamData[]>([]);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [currentText, setCurrentText] = useState<string>('');
    const [editCards, setEditCards] = useState<EditCard[]>([]);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Can you help me improve my content?",
            sender: "user",
            timestamp: new Date(),
            persona: 'creative'
        }
    ]);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    
    // Voice features state
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [speechEnabled, setSpeechEnabled] = useState<boolean>(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
    
    // Additional feature state
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [currentPersona, setCurrentPersona] = useState<AIPersona>('creative');
    const [streamSpeed, setStreamSpeed] = useState<number>(100);
    const [onlineUsers] = useState<string[]>(['You', 'AI Assistant']);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [suggestions] = useState<string[]>([
        "Make it more engaging",
        "Add technical details", 
        "Simplify the language",
        "Add visual elements",
        "Improve SEO",
        "Make it conversational"
    ]);
    const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
    const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(false);
    
    // Refs
    const eventSourceRef = useRef<EventSource | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognition = useRef<any>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Personas configuration
    const personas = {
        creative: { 
            name: "Creative Assistant", 
            color: "bg-purple-600", 
            description: "Imaginative and artistic" 
        },
        technical: { 
            name: "Technical Expert", 
            color: "bg-blue-600", 
            description: "Precise and analytical" 
        },
        casual: { 
            name: "Casual Friend", 
            color: "bg-green-600", 
            description: "Friendly and relaxed" 
        },
        professional: { 
            name: "Business Pro", 
            color: "bg-gray-600", 
            description: "Formal and structured" 
        }
    };

    // Sound effects
    const playSound = useCallback((type: 'message' | 'success' | 'error' | 'notification') => {
        if (!speechEnabled) return;
        
        const frequencies = {
            message: [440, 554.37],
            success: [523.25, 659.25, 783.99],
            error: [220, 146.83],
            notification: [880, 987.77]
        };
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const freqs = frequencies[type];
        
        freqs.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime + index * 0.1);
            oscillator.stop(audioContext.currentTime + 0.3 + index * 0.1);
        });
    }, [speechEnabled]);

    // Copy to clipboard
    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            playSound('success');
        } catch (err) {
            playSound('error');
            console.error('Failed to copy:', err);
        }
    }, [playSound]);

    // Export chat functionality
    const exportChat = useCallback(() => {
        const chatData = {
            exportDate: new Date().toISOString(),
            messages: messages,
            persona: currentPersona,
            totalMessages: messages.length
        };
        
        const dataStr = JSON.stringify(chatData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        playSound('success');
    }, [messages, currentPersona, playSound]);

    // Voice recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';
            
            recognition.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(transcript);
                setIsListening(false);
            };
            
            recognition.current.onerror = () => {
                setIsListening(false);
                playSound('error');
            };
            
            recognition.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [playSound]);

    // Advanced voice recording with transcription
    const startVoiceRecording = useCallback(async () => {
        try {
            setTranscriptionStatus('🎤 Starting recording...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            
            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            const chunks: Blob[] = [];
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
            
            recorder.onstop = async () => {
                setTranscriptionStatus('🔄 Processing audio...');
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                
                try {
                    const transcribedText = await transcribeAudio(audioBlob);
                    if (transcribedText) {
                        setInputMessage(transcribedText);
                        setTranscriptionStatus('✅ Transcription complete!');
                        playSound('success');
                    } else {
                        setTranscriptionStatus('❌ Could not understand audio');
                        playSound('error');
                    }
                } catch (error) {
                    console.error('Transcription error:', error);
                    setTranscriptionStatus('❌ Transcription failed');
                    playSound('error');
                }
                
                stream.getTracks().forEach(track => track.stop());
                audioStreamRef.current = null;
                setTimeout(() => setTranscriptionStatus(''), 3000);
            };
            
            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
            setTranscriptionStatus('🔴 Recording... (tap to stop)');
            playSound('notification');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            setTranscriptionStatus('❌ Microphone access denied');
            playSound('error');
            setTimeout(() => setTranscriptionStatus(''), 3000);
        }
    }, [playSound]);
    
    // Stop voice recording
    const stopVoiceRecording = useCallback(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            setTranscriptionStatus('🔄 Processing...');
        }
    }, [mediaRecorder]);
    
    // Transcribe audio using Web Speech API or mock transcription
    const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockTranscriptions = [
                    "Can you help me improve my content?",
                    "Make this more engaging please",
                    "Add some technical details",
                    "Simplify the language",
                    "Can you make this sound more professional?",
                    "Help me rewrite this content"
                ];
                const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
                resolve(randomTranscription);
            }, 1500);
        });
    }, []);

    // Enhanced text-to-speech with persona voices
    const speakText = useCallback((text: string) => {
        if (!speechEnabled || !('speechSynthesis' in window)) return;
        
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voiceSettings = {
            creative: { rate: 0.9, pitch: 1.2, volume: 0.8 },
            technical: { rate: 0.8, pitch: 0.9, volume: 0.9 },
            casual: { rate: 1.0, pitch: 1.1, volume: 0.8 },
            professional: { rate: 0.7, pitch: 0.8, volume: 0.9 }
        };
        
        const settings = voiceSettings[currentPersona];
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;
        
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            const voiceIndex = {
                creative: 1,
                technical: 0,
                casual: 2,
                professional: 0
            }[currentPersona];
            
            utterance.voice = voices[Math.min(voiceIndex, voices.length - 1)];
        }
        
        let processedText = text;
        if (currentPersona === 'creative') {
            processedText = text.replace(/✨/g, '... sparkle ...')
                              .replace(/🎨/g, '... art ...')
                              .replace(/🎭/g, '... drama ...');
        }
        
        utterance.text = processedText;
        speechSynthesis.speak(utterance);
    }, [speechEnabled, currentPersona]);
    
    // Toggle voice recording
    const toggleVoiceRecording = useCallback(() => {
        if (isRecording) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
        }
    }, [isRecording, startVoiceRecording, stopVoiceRecording]);

    // Auto-scroll - only when user sends message or AI is streaming
    const scrollToBottom = (): void => {
        if (shouldAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };
    
    const scrollToTop = (): void => {
        chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Handle scroll to show/hide scroll-to-top button
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = e.currentTarget;
        setShowScrollTop(scrollTop > 200);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentText, editCards, shouldAutoScroll]);

    // Core parsing logic - RESTORED ORIGINAL
    const parseEditCards = (text: string): { cleanText: string; cards: EditCard[] } => {
        const cardRegex = /<edit_card>\s*cardid:([^\n]+)\s*old_text:([^\n]+)\s*new_text:([^\n]+)\s*<\/edit_card>/g;
        const cardsMap = new Map<string, EditCard>();
        let match;
    
        while ((match = cardRegex.exec(text)) !== null) {
            const cardId = match[1].trim();
            cardsMap.set(cardId, {
                cardId: cardId,
                oldText: match[2].trim(),
                newText: match[3].trim()
            });
        }
    
        const cards = Array.from(cardsMap.values());
        
        // RESTORED ORIGINAL CLEANING LOGIC
        let cleanText = text.replace(cardRegex, '').replace(/^\[\]/, '');
        cleanText = cleanText.replace(/\[\][\s\S]*$/s, ''); // Stop at second []
        cleanText = cleanText.replace(/\d+\.\s*\*\*[^:]+:\*\*[^.]*\./g, '');
        cleanText = cleanText.replace(/^[-•]\s*/gm, '');
        cleanText = cleanText.replace(/\n\s*\n/g, '\n').trim();
        
        return { cleanText, cards };
    };

    // Core streaming logic - CONNECTS TO YOUR ACTUAL SERVER
    const startStream = () => {
        setStreamData([]);
        setCurrentText('');
        setIsStreaming(true);
        setIsTyping(true);
        setEditCards([]);
        setShouldAutoScroll(true);

        // Connect to your actual server (no persona param since your server doesn't use it yet)
        eventSourceRef.current = new EventSource(`http://localhost:3001/api/stream`);

        eventSourceRef.current.onmessage = (event) => {
            try {
                const data: StreamData = JSON.parse(event.data);
                setStreamData(prev => [...prev, data]);
                
                if (data.type === 'final_message') {
                    const finalText = data.message || data.text || '';
                    const { cards } = parseEditCards(finalText);
                    setEditCards(cards);
                    setIsStreaming(false);
                    
                    if (currentText) {
                        const newMessage: Message = {
                            id: messages.length + 1,
                            text: currentText,
                            sender: 'assistant',
                            timestamp: new Date(),
                            persona: currentPersona
                        };
                        setMessages(prev => [...prev, newMessage]);
                        
                        if (speechEnabled) {
                            setTimeout(() => speakText(currentText), 1000);
                        }
                    }
                    setCurrentText('');
                    setIsTyping(false);
                    eventSourceRef.current?.close();
                    playSound('message');
                    
                } else if (data.text) {
                    // RESTORED ORIGINAL TEXT CLEANING LOGIC
                    let displayText = data.text
                        .replace(/^\[\]/, '') // Remove leading []
                        .replace(/<edit_card>[\s\S]*?(?:<\/edit_card>|$)/g, '') // Remove edit cards
                        .replace(/\[\][\s\S]*$/s, '') // Remove everything after second []
                        .replace(/I've (optimized|enhanced)[\s\S]*$/si, '') // Remove I've enhanced/optimized...
                        .replace(/\d+\.\s*\*\*[^:]+:\*\*[\s\S]*$/g, '') // Remove numbered explanations
                        .replace(/These improvements[\s\S]*$/si, '') // Remove These improvements...
                        .replace(/^[-•]\s*/gm, '') // Remove bullets
                        .replace(/\n\s*\n/g, '\n') // Clean whitespace
                        .trim();
                    
                    setCurrentText(displayText);
                }
            } catch (error) {
                console.error('Error parsing stream data:', error);
                playSound('error');
            }
        };

        eventSourceRef.current.onerror = (error) => {
            console.error('Stream error:', error);
            setIsStreaming(false);
            setIsTyping(false);
            eventSourceRef.current?.close();
            playSound('error');
        };
    };

    useEffect(() => {
        // Start stream on load
        startStream();
        
        // COMPLETELY prevent any scrolling behavior
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.documentElement.style.height = '100vh';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        // Force to top (just in case)
        window.scrollTo(0, 0);
        
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = 0;
        }
        
        return () => {
            eventSourceRef.current?.close();
            // Restore scrolling when component unmounts
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    // Message sending
    const handleSendMessage = (): void => {
        if (inputMessage.trim() && !isStreaming) {
            const newMessage: Message = {
                id: messages.length + 1,
                text: inputMessage,
                sender: 'user',
                timestamp: new Date(),
                persona: currentPersona
            };
            
            setMessages(prev => [...prev, newMessage]);
            setInputMessage('');
            setEditCards([]);
            setIsTyping(true);
            setShouldAutoScroll(true); // Enable auto-scroll when user sends message
            playSound('message');
            
            setTimeout(() => {
                startStream();
            }, 800);
        }
    };

    // Clear chat
    const clearChat = (): void => {
        setMessages([]);
        setCurrentText('');
        setEditCards([]);
        setIsStreaming(false);
        setIsTyping(false);
        setShouldAutoScroll(false); // Disable auto-scroll when clearing
        eventSourceRef.current?.close();
        playSound('notification');
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Apply changes
    const handleApplyChanges = (accepted: boolean, cardId: string): void => {
        const card = editCards.find(c => c.cardId === cardId);
        if (card) {
            const statusMessage: Message = {
                id: messages.length + 1,
                text: accepted ? `✅ Applied changes: ${card.cardId}` : `❌ Rejected changes: ${card.cardId}`,
                sender: 'system',
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, statusMessage]);
            setEditCards(prev => prev.filter(c => c.cardId !== cardId));
            
            if (accepted) {
                playSound('success');
            } else {
                playSound('error');
            }
        }
    };

    // Message reactions
    const handleReaction = (messageId: number, reaction: 'like' | 'dislike') => {
        setMessages(prev => prev.map(msg => 
            msg.id === messageId 
                ? { ...msg, reaction: msg.reaction === reaction ? undefined : reaction }
                : msg
        ));
        playSound('notification');
    };

    // Theme classes
    const themeClasses = {
        bg: darkMode ? 'bg-black' : 'bg-white',
        text: darkMode ? 'text-white' : 'text-black',
        border: darkMode ? 'border-white/20' : 'border-black/20',
        cardBg: darkMode ? 'bg-black/40' : 'bg-white/40',
        inputBg: darkMode ? 'bg-[#2B2B2B]' : 'bg-gray-100'
    };

    return (
        <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-gray-900 overflow-hidden p-4">
            <div className={`w-full max-w-[468px] h-full max-h-[90vh] flex flex-col relative overflow-hidden ${themeClasses.bg} ${themeClasses.text} shadow-2xl rounded-lg`}>
                <style>{`
                    /* Force full viewport and prevent page scroll */
                    body, html {
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        height: 100vh !important;
                        width: 100vw !important;
                    }
                    
                    #root {
                        height: 100vh !important;
                        width: 100vw !important;
                        overflow: hidden !important;
                    }
                    
                    * {
                        box-sizing: border-box;
                    }
                    
                    /* Scrollbar styles */
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'};
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: ${darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(107, 114, 128, 0.5)'};
                    }
                    
                    /* Animations */
                    @keyframes slideInRight {
                        from { opacity: 0; transform: translateX(30px) scale(0.9); }
                        to { opacity: 1; transform: translateX(0) scale(1); }
                    }
                    
                    @keyframes slideInLeft {
                        from { opacity: 0; transform: translateX(-30px) scale(0.9); }
                        to { opacity: 1; transform: translateX(0) scale(1); }
                    }
                    
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px) scale(0.9); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-5px); }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    
                    @keyframes typingDots {
                        0%, 20% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    
                    @keyframes cardSlideIn {
                        from { 
                            opacity: 0; 
                            transform: translateY(40px) scale(0.8); 
                            filter: blur(10px);
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0) scale(1); 
                            filter: blur(0px);
                        }
                    }
                    
                    @keyframes gradientShift {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                    }
                    
                    /* Animation classes */
                    .message-user {
                        animation: slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    
                    .message-assistant {
                        animation: slideInLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    
                    .message-system {
                        animation: fadeInUp 0.4s ease-out;
                    }
                    
                    .card-appear {
                        animation: cardSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    
                    .typing-indicator {
                        animation: bounce 1s infinite;
                    }
                    
                    .typing-dots span {
                        animation: typingDots 1.4s infinite;
                    }
                    
                    .typing-dots span:nth-child(2) {
                        animation-delay: 0.2s;
                    }
                    
                    .typing-dots span:nth-child(3) {
                        animation-delay: 0.4s;
                    }
                    
                    .send-button {
                        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    
                    .send-button:hover:not(:disabled) {
                        transform: scale(1.05);
                    }
                    
                    .card-button {
                        transition: all 0.2s ease;
                    }
                    
                    .card-button:hover {
                        transform: scale(1.15) rotate(5deg);
                    }
                    
                    .header-glow {
                        background: linear-gradient(45deg, ${darkMode ? '#000000, #1a1a1a, #000000' : '#ffffff, #f3f4f6, #ffffff'});
                        background-size: 400% 400%;
                        animation: gradientShift 3s ease infinite;
                    }
                    
                    .input-focus:focus-within {
                        border-color: rgba(59, 130, 246, 0.5);
                        transition: border-color 0.2s ease;
                    }
                    
                    .listening-pulse {
                        animation: pulse 1s infinite;
                    }
                `}</style>

                {/* Header */}
                <div className={`relative z-10 p-4 header-glow ${themeClasses.border} border-b`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <h1 className="font-inter font-medium text-[16px] leading-[18.88px] tracking-[0%]">
                                AI Chat
                            </h1>
                            <div className="flex items-center space-x-1 text-xs opacity-60">
                                <FiUsers className="w-3 h-3" />
                                <span>{onlineUsers.length}</span>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs ${personas[currentPersona].color} text-white`}>
                                {personas[currentPersona].name}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-1 rounded hover:bg-gray-500/20 transition-colors"
                                title="Toggle Theme"
                            >
                                {darkMode ? <IoSunny className="w-4 h-4" /> : <IoMoon className="w-4 h-4" />}
                            </button>
                            
                            <button
                                onClick={() => setSpeechEnabled(!speechEnabled)}
                                className="p-1 rounded hover:bg-gray-500/20 transition-colors"
                                title="Toggle Sound"
                            >
                                {speechEnabled ? <IoVolumeHigh className="w-4 h-4" /> : <IoVolumeOff className="w-4 h-4" />}
                            </button>
                            
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-1 rounded hover:bg-gray-500/20 transition-colors"
                                title="Settings"
                            >
                                <FiSettings className="w-4 h-4" />
                            </button>
                            
                            <button
                                onClick={exportChat}
                                className="p-1 rounded hover:bg-gray-500/20 transition-colors"
                                title="Export Chat"
                            >
                                <IoDownload className="w-4 h-4" />
                            </button>
                            
                            {messages.length > 0 && (
                                <button
                                    onClick={clearChat}
                                    className="p-1 rounded hover:bg-red-500/20 transition-colors text-red-400"
                                    title="Clear Chat"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            
                            <IoCloseOutline className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer" />
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className={`mt-4 p-4 rounded-lg ${themeClasses.cardBg} ${themeClasses.border} border`}>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-2">AI Persona</label>
                                    <select
                                        value={currentPersona}
                                        onChange={(e) => setCurrentPersona(e.target.value as AIPersona)}
                                        className={`w-full p-2 rounded ${themeClasses.inputBg} ${themeClasses.border} border`}
                                    >
                                        {Object.entries(personas).map(([key, persona]) => (
                                            <option key={key} value={key}>
                                                {persona.name} - {persona.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Stream Speed: {streamSpeed}ms
                                    </label>
                                    <input
                                        type="range"
                                        min="50"
                                        max="300"
                                        value={streamSpeed}
                                        onChange={(e) => setStreamSpeed(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Messages */}
                <div 
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className={`flex-1 overflow-y-scroll overflow-x-hidden p-4 space-y-4 relative z-10 custom-scrollbar`}
                >
                    {/* Scroll to Top Button */}
                    {showScrollTop && (
                        <button
                            onClick={scrollToTop}
                            className="absolute top-4 right-4 z-20 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
                            title="Scroll to Top"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </button>
                    )}

                    {/* Message History */}
                    {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                px-4 py-2 rounded-[10px] border max-w-[300px] relative group
                                ${message.sender === 'user' 
                                    ? `${themeClasses.inputBg} ${themeClasses.border} message-user` 
                                    : message.sender === 'system'
                                    ? 'bg-green-600/20 border-green-500/30 message-system'
                                    : `${themeClasses.cardBg} ${themeClasses.border} message-assistant`
                                }
                            `}>
                                {message.sender === 'assistant' && (
                                    <div className={`absolute -left-2 top-3 w-2 h-2 ${personas[message.persona || currentPersona].color.replace('bg-', 'bg-')} rounded-full animate-pulse`}></div>
                                )}
                                
                                <p className="text-left font-inter font-normal text-[15px] leading-none tracking-[-0.02em]">
                                    {message.text}
                                </p>
                                
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs opacity-60">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => copyToClipboard(message.text)}
                                            className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                                            title="Copy"
                                        >
                                            <IoCopy className="w-3 h-3" />
                                        </button>
                                        
                                        {message.sender === 'assistant' && (
                                            <button
                                                onClick={() => speakText(message.text)}
                                                className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                                                title="Speak"
                                            >
                                                <IoVolumeHigh className="w-3 h-3" />
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => handleReaction(message.id, 'like')}
                                            className={`p-1 hover:bg-gray-500/20 rounded transition-colors ${message.reaction === 'like' ? 'text-green-500' : ''}`}
                                            title="Like"
                                        >
                                            <FiThumbsUp className="w-3 h-3" />
                                        </button>
                                        
                                        <button
                                            onClick={() => handleReaction(message.id, 'dislike')}
                                            className={`p-1 hover:bg-gray-500/20 rounded transition-colors ${message.reaction === 'dislike' ? 'text-red-500' : ''}`}
                                            title="Dislike"
                                        >
                                            <FiThumbsDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && !currentText && (
                        <div className="flex justify-start">
                            <div className={`px-4 py-2 rounded-2xl ${themeClasses.cardBg} backdrop-blur-sm message-assistant relative`}>
                                <div className={`absolute -left-2 top-3 w-2 h-2 ${personas[currentPersona].color.replace('bg-', 'bg-')} rounded-full animate-pulse`}></div>
                                <div className="flex items-center space-x-1 typing-dots">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    <span className="text-sm text-gray-400 ml-2">
                                        {personas[currentPersona].name} is thinking...
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Streaming Message */}
                    {currentText && (
                        <div className="flex justify-start">
                            <div className={`max-w-[374.29px] min-h-[57.06px] px-4 py-2 rounded-2xl ${themeClasses.cardBg} backdrop-blur-sm message-assistant relative`}>
                                <div className={`absolute -left-2 top-3 w-2 h-2 ${personas[currentPersona].color.replace('bg-', 'bg-')} rounded-full animate-pulse`}></div>
                                <p className="text-left font-inter font-normal text-[15px] leading-[18.88px] tracking-[0%]">
                                    {currentText} 
                                    {isStreaming && <span className="animate-pulse text-blue-400 ml-1 typing-indicator">|</span>}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Apply Changes Cards */}
                    {editCards.map((card) => (
                        <div key={card.cardId} className={`w-full max-w-[430px] min-h-[187px] ${themeClasses.cardBg} backdrop-blur-md rounded-xl px-[6.5px] py-[10px] border ${themeClasses.border} mb-4 card-appear relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <span className="font-inter font-normal text-[15px] leading-[17.56px] tracking-[0%]">Apply Changes?</span>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => handleApplyChanges(false, card.cardId)} 
                                        className="w-[22.46px] h-[22.35px] bg-[#DF4739] rounded-full flex items-center justify-center card-button"
                                    >
                                        <IoClose className="text-white text-sm" />
                                    </button>
                                    <button 
                                        onClick={() => handleApplyChanges(true, card.cardId)} 
                                        className="w-[22.46px] h-[22.35px] bg-[#20BC3F] rounded-full flex items-center justify-center card-button"
                                    >
                                        <FcOk className="text-sm" />
                                    </button>
                                </div>
                            </div>

                            <div className={`w-full h-[50px] rounded-t-[8.37px] border ${themeClasses.border} mb-2 flex items-center px-3 overflow-hidden relative z-10`} 
                                 style={{background: darkMode ? "linear-gradient(0deg, #161616, #161616), linear-gradient(0deg, #212121, #212121)" : "linear-gradient(0deg, #f3f4f6, #f3f4f6), linear-gradient(0deg, #e5e7eb, #e5e7eb)"}}>
                                <div className="text-[15px] text-left font-inter font-normal leading-tight w-full break-words">
                                    {card.oldText}
                                </div>
                            </div>

                            <div className={`w-full min-h-[72px] rounded-t-[10px] border flex items-center px-3 py-2 overflow-hidden relative z-10`} 
                                 style={{ 
                                     background: darkMode 
                                         ? "linear-gradient(111.12deg, rgba(255, 255, 255, 0.25) -39.68%, rgba(153, 153, 153, 0.15) 82.31%)"
                                         : "linear-gradient(111.12deg, rgba(0, 0, 0, 0.25) -39.68%, rgba(100, 100, 100, 0.15) 82.31%)",
                                     borderImage: darkMode 
                                         ? "linear-gradient(337.29deg, rgba(53, 53, 53, 0.1) -43.83%, rgba(155, 155, 155, 0.5) 99.97%) 1"
                                         : "linear-gradient(337.29deg, rgba(200, 200, 200, 0.1) -43.83%, rgba(100, 100, 100, 0.5) 99.97%) 1"
                                 }}>
                                <div className="text-[15px] text-left font-inter font-normal leading-tight break-words w-full">
                                    {card.newText}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Smart Suggestions */}
                    {!isStreaming && !isTyping && messages.length > 1 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {suggestions.slice(0, 3).map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInputMessage(suggestion)}
                                    className={`px-3 py-1 text-xs ${themeClasses.cardBg} ${themeClasses.border} border rounded-full hover:scale-105 transition-transform`}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={`relative z-10 p-4 ${themeClasses.bg}`}>
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 relative">
                            <div className={`w-full h-auto min-h-[60px] relative flex items-center rounded-[20.64px] border-[0.85px] ${themeClasses.inputBg} ${themeClasses.border} p-4 input-focus`}>
                                <div className={`w-[28.17px] h-[28.03px] rounded-[29.36px] ${darkMode ? 'bg-[#575757]' : 'bg-gray-300'} flex items-center justify-center flex-shrink-0 mr-3`} style={{boxShadow: '0px 0px 17.38px 0px #00000040'}}>
                                    <FiPlus className="w-5 h-5 text-gray-400" />
                                </div>
                                
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask for content improvements..."
                                    disabled={isStreaming}
                                    className={`flex-1 bg-transparent border-none resize-none focus:outline-none disabled:opacity-50 ${themeClasses.text}`}
                                    style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '15px',
                                        lineHeight: '100%', letterSpacing: '-2%'
                                    }}
                                    rows={1}
                                />
                                
                                <div className="flex items-center space-x-2 ml-3">
                                    {/* Voice Recording Button */}
                                    <button
                                        onClick={toggleVoiceRecording}
                                        disabled={isStreaming}
                                        className={`w-[32px] h-[32px] ${
                                            isRecording 
                                                ? 'bg-red-600 animate-pulse' 
                                                : 'bg-purple-600 hover:bg-purple-700'
                                        } disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all`}
                                        title={isRecording ? "Stop Recording" : "Voice Record & Transcribe"}
                                    >
                                        {isRecording ? (
                                            <div className="w-3 h-3 bg-white rounded-sm"></div>
                                        ) : (
                                            <IoMic className="w-4 h-4 text-white" />
                                        )}
                                    </button>
                                    
                                    {/* Quick Voice Input (old method) */}
                                    {recognition.current && (
                                        <button
                                            onClick={() => {
                                                if (isListening) {
                                                    recognition.current.stop();
                                                    setIsListening(false);
                                                } else {
                                                    recognition.current.start();
                                                    setIsListening(true);
                                                    playSound('notification');
                                                }
                                            }}
                                            disabled={isStreaming || isRecording}
                                            className={`w-[28px] h-[28px] ${isListening ? 'bg-blue-600 listening-pulse' : 'bg-gray-600'} hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all`}
                                            title={isListening ? "Stop Listening" : "Quick Voice Input"}
                                        >
                                            {isListening ? <IoMicOff className="w-3 h-3 text-white" /> : <IoMic className="w-3 h-3 text-white" />}
                                        </button>
                                    )}
                                    
                                    {/* Send Button */}
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isStreaming}
                                        className="w-[32px] h-[32px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center send-button"
                                    >
                                        {isStreaming ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                
                                {/* Transcription Status */}
                                {transcriptionStatus && (
                                    <div className="absolute -top-8 left-0 right-0 text-center">
                                        <span className="text-xs bg-black/80 text-white px-2 py-1 rounded">
                                            {transcriptionStatus}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;