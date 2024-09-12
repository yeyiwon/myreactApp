import React, { useState, useRef, useEffect } from 'react';
import { TiArrowUp } from "react-icons/ti";
import AppBarHeader from './Header';

interface Message {
  id: string;
  text: string;
  senderName: string;
  senderProfilePic: string;
  isCurrentUser: boolean;
}

const ChatRoom: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hey, how are you?', senderName: 'User 1', senderProfilePic: 'https://via.placeholder.com/30', isCurrentUser: false },
    { id: '2', text: 'Can we meet tomorrow?', senderName: 'User 1', senderProfilePic: 'https://via.placeholder.com/30', isCurrentUser: false },

  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
   const inputRef = useRef<HTMLInputElement | null>(null);


  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, {
        id: Date.now().toString(),
        text: message,
        senderName: 'You',
        senderProfilePic: 'https://via.placeholder.com/30',
        isCurrentUser: true,
      }]);
      setMessage('');
        inputRef.current?.focus();

      // 메시지 전송 후 입력창 포커스 유지
    }
  };


  useEffect(() => {
    // 최신 메시지로 스크롤
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '65px'  }}>
      {/* 채팅 메시지 리스트 */}
      <AppBarHeader title='User1' showBackButton={true}/>
      <div style={{ 
        flex: 1, 
        padding: '10px', 
        overflowY: 'auto', 
        backgroundColor: '#fff', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            display: 'flex', 
            flexDirection: msg.isCurrentUser ? 'row-reverse' : 'row', 
            marginBottom: '10px', 
            alignItems: 'flex-start', 
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            {!msg.isCurrentUser && (
              <img
                src={msg.senderProfilePic}
                alt={`${msg.senderName}'s profile`}
                style={{ borderRadius: '50%', width: '40px', height: '40px', marginRight: '10px' }}
              />
            )}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              fontSize: '14px',
              alignItems: msg.isCurrentUser ? 'flex-end' : 'flex-start' 
            }}>
              <div style={{ 
                padding: '10px', 
                backgroundColor: msg.isCurrentUser ? '#e7e7e7' : '#f9f9f9', // 
                color: msg.isCurrentUser ? '#333' : '#333', // 텍스트 색상
                borderRadius: '8px', 
                fontSize: '14px',
                // maxWidth: '70%', 
                wordBreak: 'break-word',
                // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                marginBottom: '5px',
                animation: 'slideUp 0.3s ease-out'
              }}>
                {msg.text}
              </div>
            </div>
            {msg.isCurrentUser && (
              <div style={{ width: '40px', height: '40px' }} /> 
            )}
          </div>
        ))}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      {/* 입력창 */}
      <div style={{ 
        padding: '1em',
        boxSizing: 'border-box', 
        // borderTop: '1px solid #ccc', 
        backgroundColor: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        position: 'fixed', 
        bottom: 0, 
        width: '100%' 
      }}>
        <input
            ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          placeholder="MSG "
          style={{ 
            width: 'calc(100% - 50px)' ,
            padding: '1em', 
            border: '1px solid #eee',
            boxShadow: '0px 0px 1px 0px rgba(0,0,0,0.1)', 
            borderRadius: '20px', 
            marginRight: '10px' ,
            transition: 'border-color 0.3s',
          }}
          className='FocusColor'
        />
        <button
          onClick={handleSendMessage}
          style={{ 
            padding: '10px', 
            border: 'none', 
            height: '40px',
            width: '40px',
            backgroundColor: '#000', 
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '50%', 
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' 
            
          }}
          className='ChatBtn'
          disabled={!message.trim()}
        >
           <TiArrowUp color="#f7f7f7" size={22} />
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
