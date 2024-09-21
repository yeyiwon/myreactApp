import React, { useState, useRef, useEffect, useContext } from 'react';
import { TiArrowUp } from "react-icons/ti";
import AppBarHeader from '../LayOut/Header';
import { Link, useParams } from 'react-router-dom';
import AuthContext from 'Context/AuthContext';
import ThemeContext from '../../Context/ThemeContext';
import { collection, onSnapshot, addDoc, query, orderBy, getDoc, doc, updateDoc, getDocs, writeBatch, where } from 'firebase/firestore';
import { db } from 'firebaseApp';
import { ChatRoomProps, UserProps, Message } from 'types/InterfaceTypes';
import { Avatar, Divider } from '@mui/material';

// 날짜를 포맷
const formatDate = (date: Date) => {
    return date.toLocaleDateString();
};

// 시간을 포맷팅
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
            // 룸 아이디와 현재 로그인한 사용자 uid가 있을 때만 얘네 둘다 없으면 사용 안함
            const chatRoomDoc = doc(db, 'ChatRooms', roomId);
            const messagesCollection = collection(db, `ChatRooms/${roomId}/Messages`);
            // messagesCollection 에 메세지들을 담아서 타임스탬프 기준으로 정렬
            const sortmsg = query(messagesCollection, orderBy('timestamp'));
            // 정렬을 먼저 해놓고 실시간으로 받는 이유는 새로운 메시지가 추가되거나 기존 메시지가 업데이트될 때마다 자동으로 반영되게 하기 위함
        const filterMessages = onSnapshot(sortmsg, async (snapshot) => {
                const newMessages = snapshot.docs.map(msg => ({ id: msg.id, ...msg.data() })) as Message[];
                console.log(newMessages)
                // 얘는 지금 채팅방의 전체메세지 내용 
                setMessages(newMessages);

                const unreadMessages = newMessages.filter(msg => msg.senderId !== user.uid && !msg.isRead);
                // 현재 로그인 한 사용자가 보낸 게 아닐 경우에 안 읽음 처리가 필요하고 
                // 안 읽은 내용만 모아둘라고 unreadMessages 에 담기 
                // 그 길이가 0 보다 길때 
                if (unreadMessages.length > 0) {
                    const batch = writeBatch(db);
                    // writeBatch 요친구가 한 번에 일처리르 해주는 아이라함
                    unreadMessages.forEach(msg => {
                        const messageRef = doc(db, `ChatRooms/${roomId}/Messages`, msg.id);
                        // 여기서 또 foEach를 도는 이유 unreadMessages 얘는 배열이라 오류가 났음 객체로 또 분리하여 작업하기 위해 forEach ehfr

                    batch.update(messageRef, { isRead: true });
                    });

                    await batch.commit();
                    await updateDoc(chatRoomDoc, {
                        [`unreadMessages.${user.uid}`]: 0
                        // 디비 카운트 0 까지 확실한 마무리
                    })
                }
            });

            const updateChatRoom = onSnapshot(chatRoomDoc, async (snapshot) => {
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
                filterMessages();
                updateChatRoom();
            };
        }
    }, [roomId, user?.uid]);
    // 읽음 안 읽음에 관해선 useEffect 가 해주는 원리라서 
    // roomId나 user.uid가 변경될 때마다 실행됨 얘네 둘 실행 
    // filterMessages();updateChatRoom();

    const SendMessage = async () => {
        if (user?.uid && roomId) {
                const messagesCollection = collection(db, `ChatRooms/${roomId}/Messages`);
                // ChatRooms/${roomId}/Messages 여기 배열에 들어갈 것이기 때문에 경로 명확히 지정하기 !! 
                await addDoc(messagesCollection, {
                    // 메세지 데베에 들어갈 내용들 
                    text: newMessage,
                    senderId: user.uid,
                    timestamp: new Date(),
                    isRead: false,
                    senderProfilePic: user.photoURL,
                    senderName: user.displayName,
                });

                setNewMessage(''); 
                // 메세지 전송 후 상태 초기화 + 커서 포커스
                textareaRef.current?.focus();

                const chatRoomDoc = doc(db, 'ChatRooms', roomId);
                const chatRoomSnap = await getDoc(chatRoomDoc);
                const chatRoomData = chatRoomSnap.data() as ChatRoomProps;

                if (chatRoomData.users) {
                    // 사용자 목록 확인하고 ! 유저 아이디 제외한 나머지 사용자 데려오기 
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
        } else {
            console.error('메시지나 사용자 정보가 없습니다.');
        }
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        SendMessage();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            SendMessage();
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
            <div className='chatContent' style={{overflowY: 'hidden', paddingBottom: '55px', display: 'flex', justifyContent: 'flex-end' }}>
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
                                    <Link to={`/user/${msg.senderId}`}>
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
                                    </Link>
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
                                    {/* {msg.senderId === user?.uid && (
                                        <div style={{ width: '40px', height: '40px' }} />
                                    )} */}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        <div className='textareabox_area'>
            <form onSubmit={onSubmit} className='textareabox'>
                <textarea
                    ref={textareaRef}

                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={onKeyDown}
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
