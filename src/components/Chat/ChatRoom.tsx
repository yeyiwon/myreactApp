import React, { useState, useRef, useEffect, useContext } from 'react';
import { TiArrowUp } from "react-icons/ti";
import AppBarHeader from '../LayOut/Header';
import { useParams } from 'react-router-dom';
import AuthContext from 'Context/AuthContext';
import ThemeContext from '../../Context/ThemeContext';
import { collection, onSnapshot, addDoc, query, orderBy, getDoc, doc, updateDoc, getDocs, writeBatch, where } from 'firebase/firestore';
import { db } from 'firebaseApp';
import { ChatRoomProps, UserProps, Message } from 'types/InterfaceTypes';
import { Avatar, Divider } from '@mui/material';

// 날짜를 포맷팅하는 헬퍼 함수 
const formatDate = (date: Date) => {
    return date.toLocaleDateString();
};

// 시간을 포맷팅하는 헬퍼 함수 
export const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export default function ChatRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatRoom, setChatRoom] = useState<ChatRoomProps | null>(null);
    const [participant, setParticipant] = useState<UserProps | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const { theme } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);


// 메시지가 업데이트될 때마다 스크롤을 하단으로 이동
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
 useEffect(() => {
        if (roomId && user?.uid) {
            const chatRoomDoc = doc(db, 'ChatRooms', roomId);
            const messagesCollection = collection(db, `ChatRooms/${roomId}/Messages`);
            const q = query(messagesCollection, orderBy('timestamp'));

            const unsubscribeMessages = onSnapshot(q, async (snapshot) => {
                const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];

                setMessages(prevMessages => {
                    const existingMessageIds = new Set(prevMessages.map(msg => msg.id));
                    const filteredNewMessages = newMessages.filter(msg => !existingMessageIds.has(msg.id));
                    return [...prevMessages, ...filteredNewMessages];
                });

                const unreadMessages = newMessages.filter(msg => msg.senderId !== user.uid && !msg.isRead);
                if (unreadMessages.length > 0) {
                    const batch = writeBatch(db);
                    unreadMessages.forEach(msg => {
                        const messageRef = doc(db, `ChatRooms/${roomId}/Messages`, msg.id);
                        batch.update(messageRef, { isRead: true });
                    });
                    await batch.commit();
                }

                await updateDoc(chatRoomDoc, {
                    [`unreadMessages.${user.uid}`]: 0
                }).catch((error) => {
                    console.error('Error marking messages as read:', error);
                });
            });

            const unsubscribeChatRoom = onSnapshot(chatRoomDoc, async (snapshot) => {
                const chatRoomData = snapshot.data() as ChatRoomProps;
                setChatRoom(chatRoomData);

                if (chatRoomData?.users) {
                    const participantId = chatRoomData.users.find(id => id !== user?.uid);
                    if (participantId) {
                        const userDoc = doc(db, 'Users', participantId);
                        const userSnap = await getDoc(userDoc);
                        setParticipant(userSnap.data() as UserProps);
                    }
                }
            });

            return () => {
                unsubscribeMessages();
                unsubscribeChatRoom();
            };
        }
    }, [roomId, user?.uid]);

    const handleSendMessage = async () => {
        if (newMessage.trim() && user?.uid && roomId) {
            try {
                const messagesCollection = collection(db, `ChatRooms/${roomId}/Messages`);
                await addDoc(messagesCollection, {
                    text: newMessage,
                    senderId: user.uid,
                    timestamp: new Date(),
                    isRead: false,
                    senderProfilePic: user.photoURL,
                    senderName: user.displayName,
                });

                setNewMessage('');
                textareaRef.current?.focus();

                const chatRoomDoc = doc(db, 'ChatRooms', roomId);
                const chatRoomSnap = await getDoc(chatRoomDoc);
                const chatRoomData = chatRoomSnap.data() as ChatRoomProps;

                if (chatRoomData.users) {
                    const participantIds = chatRoomData.users.filter(id => id !== user.uid);
                    const updates: { [key: string]: any } = {
                        lastMessage: newMessage,
                        lastMessageTimestamp: new Date(),
                    };
                    participantIds.forEach(participantId => {
                        updates[`unreadMessages.${participantId}`] = (chatRoomData.unreadMessages?.[participantId] ?? 0) + 1;
                    });

                    await updateDoc(chatRoomDoc, updates);
                } else {
                    console.error('채팅방의 사용자 목록이 존재하지 않습니다.');
                }

            } catch (error) {
                console.error('메시지 전송 중 오류 발생:', error);
            }
        } else {
            console.error('메시지나 사용자 정보가 없습니다.');
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSendMessage();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const groupedMessages = messages.reduce((acc, msg, index) => {
        const date = new Date(msg.timestamp.seconds * 1000);
        const dateString = formatDate(date);
        const prevDate = index > 0 ? formatDate(new Date(messages[index - 1].timestamp.seconds * 1000)) : null;

        if (prevDate !== dateString) {
            if (!acc[dateString]) {
                acc[dateString] = [];
            }
            acc[dateString].push(msg);
        } else {
            if (acc[dateString]) {
                acc[dateString].push(msg);
            }
        }
        return acc;
    }, {} as Record<string, Message[]>);

    return (
        <div>
            <div className='chatContent' style={{overflowY: 'scroll', paddingBottom: '55px', display: 'flex', justifyContent: 'flex-end' }}>
                <AppBarHeader title={participant?.displayName || 'Loading...'} showBackButton={true} />
                {Object.keys(groupedMessages).map(date => (
                    <div key={date} style={{ marginBottom: '10px', fontSize: '12px' }}>
                        <Divider>
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '10px',
                                color: theme === 'dark' ? '#eee' : '#888',
                                padding: '5px 10px',
                                margin: '0 auto'
                            }}>
                                {date}
                            </div>
                        </Divider>
                        <div>
                            {groupedMessages[date].map((msg) => (
                                <div key={msg.id} style={{
                                    display: 'flex',
                                    flexDirection: msg.senderId === user?.uid ? 'row-reverse' : 'row',
                                    marginBottom: '10px',
                                    alignItems: 'flex-start',
                                    animation: 'fadeIn 0.3s ease-in-out'
                                }}>
                            {msg.senderId !== user?.uid && (
                                    
                                    <Avatar
                                        src={participant?.photoURL}
                                        alt={`${participant?.displayName}'s profile`}
                                        sx={{
                                            boxShadow: 3,
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            marginRight: msg.senderId === user?.uid ? '0px' : '10px',
                                            marginLeft: msg.senderId === user?.uid ? '10px' : '0px' 
                                        }}
                                    />
                                    
                                )}
                                    
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        fontSize: '14px',
                                        alignItems: msg.senderId === user?.uid ? 'flex-end' : 'flex-start'
                                    }}>
                                        { msg.senderId !== user?.uid ? <p style={{ fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' ,
                                        color: theme === 'light' ? '#333' : '#F7F7F7',
                                    }}> {participant?.displayName} </p> : '' }
                                        

                                        <div style={{ display: 'flex', alignItems: 'center' }}>

                                            <div className='chatingmsgBox' style={{
                                                backgroundColor: msg.senderId === user?.uid
                                                    ? (theme === 'dark' ? '#eee' : 'rgba(88, 14, 246,0.2)')
                                                    : (theme === 'dark' ? '#eee' : '#f9f9f9'),
                                                animation: 'slideUp 0.3s ease-out'
                                            }}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    <span className='TimeStamp'>
                                        {msg.senderId === user?.uid && !msg.isRead ? (
                                            <span style={{ marginRight: '5px', fontSize: '10px', color: theme === 'dark' ? '#bbb' : '#555' }}>
                                                읽지 않음
                                            </span>
                                        ) : null}
                                        {formatTime(new Date(msg.timestamp.seconds * 1000))}
                                    </span>
                                    </div>
                                    {msg.senderId === user?.uid && (
                                        <div style={{ width: '40px', height: '40px' }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        <div className='textareabox_area'>
            <form onSubmit={handleSubmit} className='textareabox'>
                <textarea
                    ref={textareaRef}

                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지 입력"
                    className='ChatTextarea'
                />
                <button
                    
                    className='ChatBtn'
                    disabled={!newMessage.trim()}
                >
                    <TiArrowUp color="#f7f7f7" size={30} />
                </button>
            </form>
        </div>
        </div>
    );
}
