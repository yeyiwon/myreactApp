import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBarHeader from '../LayOut/Header';
import AppBottomNav from '../LayOut/BottomNavigation';
import { Dialog, DialogActions, DialogContent, Button, Select, MenuItem, FormControl, Badge, Avatar } from '@mui/material';
import { db } from 'firebaseApp';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import AuthContext from 'Context/AuthContext';
import { RiChatNewLine } from "react-icons/ri";
import { UserProps, ChatRoomProps, Message } from 'types/InterfaceTypes';
import { useCreateChatRoom } from './useCreateChatRoom';

import { format, isToday, formatDistanceToNow } from 'date-fns';

export default function ChatList() {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [followingList, setFollowingList] = useState<UserProps[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomProps[]>([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { handleCreateRoom } = useCreateChatRoom();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0); // 상태 추가


const formatTimestamp = (timestamp?: { seconds: number }) => {
  if (!timestamp) {
    return 'No date'; // 또는 적절한 기본값을 반환하세요
  }

  const date = new Date(timestamp.seconds * 1000);
  const now = new Date();
  
  // 오늘 날짜
  const isToday = date.toDateString() === now.toDateString();
  
  // 시간 포맷팅
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  
  if (isToday) {
    return date.toLocaleTimeString([], options); // 오늘 날짜일 경우 시간만 표시
  } else {
    return date.toLocaleDateString(); // 다른 날짜일 경우 날짜를 표시
  }
};


  // 채팅방의 상대방 정보
  const getOtherUserInfo = async (room: ChatRoomProps): Promise<UserProps | null> => {
    if (!user || !room.users) return null;
    
    const otherUserId = room.users.find((userId) => userId !== user.uid);
    if (!otherUserId) return null;

    const otherUserDocRef = doc(db, 'Users', otherUserId);
    const otherUserSnapshot = await getDoc(otherUserDocRef);
    if (otherUserSnapshot.exists()) {
      const otherUserData = otherUserSnapshot.data();
      return {
        id: otherUserId,
        ...otherUserData
      } as UserProps;
    }
    return null;
  };

   // 팔로잉 리스트
  const fetchFollowingList = async () => {
    if (user?.uid) {
      const userDoc = doc(db, 'Users', user.uid);
      const userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const followingIds: string[] = userData.following || [];

         // 팔로잉 사용자 정보 가져오기
        const followingUsers = await Promise.all(
          followingIds.map(async (id) => {
            const userDoc = await getDoc(doc(db, 'Users', id));
            if (userDoc.exists()) {
              return { id, ...userDoc.data() } as UserProps;
            }
            return null;
          })
        );

        setFollowingList(followingUsers.filter(user => user !== null) as UserProps[]);
      }
    }
  };

   // 채팅방의 메시지를 읽음으로 표시하는 함수
  const markMessagesAsRead = async (roomId: string) => {
    if (user?.uid) {
      const chatRoomRef = doc(db, 'ChatRooms', roomId);
      await updateDoc(chatRoomRef, {
        [`unreadMessages.${user.uid}`]: 0
      });
    }
  };

// 채팅방 리스트 가져오는 함수
  const fetchChatRooms = () => {
    if (user?.uid) {
      const userDoc = doc(db, 'Users', user.uid);

      // Firestore onSnapshot 리스너
      const unsubscribeUser = onSnapshot(userDoc, async (userSnap) => {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userChatRooms: string[] = userData.chatRooms || [];
          
          const chatRoomsCollection = collection(db, 'ChatRooms');
          
          // Firestore onSnapshot 리스너
          const unsubscribeChatRooms = onSnapshot(chatRoomsCollection, (chatRoomsSnapshot) => {
            const rooms = chatRoomsSnapshot.docs
              .filter(doc => userChatRooms.includes(doc.id))
              .map(async (doc) => {
                const roomData = doc.data() as Omit<ChatRoomProps, 'id'>;
                const otherUser = await getOtherUserInfo({ id: doc.id, ...roomData });
                const messageCount = roomData.Message?.length || 0;
                const lastMessage = roomData.lastMessage || '';
                const unreadMessagesCount = roomData.unreadMessages?.[user.uid] || 0;
                const lastMessageTimestamp = roomData.lastMessageTimestamp || { seconds: 0 };

                return {
                  id: doc.id,
                  ...roomData,
                  otherUser,
                  messageCount,
                  lastMessage,
                  unreadMessagesCount,
                  lastMessageTimestamp
                } as ChatRoomProps;
              });
            Promise.all(rooms).then((resolvedRooms) => {
              const sortedRooms = resolvedRooms.sort((a, b) => {
                return (b.lastMessageTimestamp?.seconds || 0) - (a.lastMessageTimestamp?.seconds || 0);
              });

              setChatRooms(sortedRooms as ChatRoomProps[]);
              const totalUnreadCount = sortedRooms.reduce((acc, room) => acc + (room.unreadMessagesCount || 0), 0);
              setUnreadMessagesCount(totalUnreadCount);
            });
          });

          return () => {
            unsubscribeChatRooms();
          };
        }
      });

      return () => {
        unsubscribeUser();
      };
    }
  };

  useEffect(() => {
    fetchChatRooms(); // 컴포넌트 마운트 시 채팅방 및 팔로잉 리스트 가져오기
    fetchFollowingList();
  }, [user?.uid]);
  const handleClose = () => {
    setOpen(false);
    setSelectedUserId(null);
  };

  const handleCreateNewChat = () => {
    if (selectedUserId) {
      handleCreateRoom(selectedUserId);
      handleClose();
    }
  };


  return (
    <div className='box'>
      <div style={{ padding: '10px', backgroundColor: 'transparent' }}>
        <AppBarHeader title='Chat' showBackButton={true}/>
        <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
          <button onClick={() => setOpen(true)} className='newChat'> 
            <RiChatNewLine /> New Chat
          </button>
        </div>

        {chatRooms.length === 0 ? (
          <div className='noPostlist'>
            <p>현재 채팅방이 없습니다.</p>
          </div>
        ) : (
          chatRooms.map((room: ChatRoomProps) => {
            const otherUser = room.otherUser;
            const unreadMessagesCount = user?.uid ? (room.unreadMessages?.[user.uid] || 0) : 0;

            return (
              <Link key={room.id} to={`/chat/${room.id}`} className='NotificationItem' style={{color: 'black', display: 'flex', alignItems: 'center', marginBottom: '10px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {otherUser?.photoURL ? (
                    <Avatar
                      src={otherUser.photoURL}
                      alt={`${otherUser.displayName}'s profile`}
                      style={{ borderRadius: '50%', width: '40px', height: '40px' }}
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ccc' }} />
                  )}
                  <div>
                  <p style={{ fontWeight: 'bold', color: '#333' }}>{otherUser?.displayName}
                  </p>
                  <p className='lastmsg'>
                    {room?.lastMessage}
                  </p>
                  </div>
                </div>
                <div style={{ marginRight: '10px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#888' }}>{formatTimestamp(room.lastMessageTimestamp)}</p>
                  <p>{unreadMessagesCount > 0 && (
                  <Badge badgeContent={unreadMessagesCount} color='error' />
                )}</p>
                </div>
                    
              </Link>
            );
          })
        )}

        <AppBottomNav />

        <Dialog open={open} onClose={handleClose}
          PaperProps={{
            style: {
              width: '280px',
              padding: '0.5em',
              borderRadius: 8,
              boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <p style={{ padding: '0.5em', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}> 😎 팔로잉 리스트에서 선택 </p>
          <DialogContent sx={{ padding: '0 12px'}}>
            <FormControl fullWidth margin="normal">
              <Select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value as string)}
                displayEmpty
                sx={{
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#580Ef6' },
                  boxShadow: '0px 0px 1px 0px rgba(0,0,0,0.1)',
                }}
                inputProps={{ sx: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '12px' } }}
              >
                <MenuItem sx={{ fontSize: '14px'}} value="" disabled>사용자 선택</MenuItem>
                {followingList.map(user => (
                  <MenuItem key={user.id} value={user.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    {user.photoURL && (
                      <img 
                        src={user.photoURL} 
                        alt={`${user.displayName}'s profile`} 
                        style={{ borderRadius: '50%', width: '30px', height: '30px' }} 
                      />
                    )}
                    {user.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
            <Button fullWidth onClick={handleClose} sx={{
              color: '#333',
              height: '40px',
              backgroundColor: '#efefef',
              
            }}>취소</Button>
            <Button fullWidth onClick={handleCreateNewChat} sx={{
              color: '#fff',
              height: '40px',
              backgroundColor: '#580Ef6',
              '&:hover': { backgroundColor: '#440bbf' },
            }}>확인</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
