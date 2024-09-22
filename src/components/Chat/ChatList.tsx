import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBarHeader from '../LayOut/Header';
import AppBottomNav from '../LayOut/BottomNavigation';
import { Dialog, DialogActions, DialogContent, Button, Select, MenuItem, FormControl, Badge, Avatar } from '@mui/material';
import { db } from 'firebaseApp';
import { collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import AuthContext from 'Context/AuthContext';
import { RiChatNewLine } from "react-icons/ri";
import { UserProps, ChatRoomProps, Message } from 'types/InterfaceTypes';
import { useCreateChatRoom } from './useCreateChatRoom';

export default function ChatList() {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [followingList, setFollowingList] = useState<UserProps[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomProps[]>([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { CreateRoom } = useCreateChatRoom();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0); // 상태 추가


const formatTimestamp = (timestamp?: { seconds: number }) => {
  if (!timestamp) {
    return 'No date'; 
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



// 채팅방 리스트 가져오는 함수 
// 흐름 정리 : 채팅방 리스트를 가져올 땐 현재 로그인 된 사용자를 Users 라는 데이터베이스 컬렉션 안에서 골라온다 
// 유저 정보를 userDoc 변수 안에 담아 놓고 onSnapshot을 하기 위해 async 한다 콜백 매개변수값으로 userSnap 
  const getChatRooms = () => {
    if (user?.uid) {
      const userDoc = doc(db, 'Users', user.uid);
      // 유저의 정보를 userDoc에 담아놓고 바뀔 때마다 호출
      const filterUser = onSnapshot(userDoc, async (userSnap) => {
        if (userSnap.exists()) {

          const userData = userSnap.data();
          const userChatRooms: string[] = userData.chatRooms || [];
          const chatRoomsCollection = collection(db, 'ChatRooms');
          
          const filterChatRooms = onSnapshot(chatRoomsCollection, async (chatRoomsSnapshot) => {
            const rooms = chatRoomsSnapshot.docs.filter(doc => userChatRooms.includes(doc.id))
              .map(doc => {
                const roomData = doc.data();
                return {
                  id: doc.id,
                  ...roomData,
                }as ChatRoomProps;
              });

            const resolvedRooms = await Promise.all(
              rooms.map(async (room) => {
                const otherUser = await getOtherUserInfo(room);
                const lastMessage = room.lastMessage || '';
                const unreadMessagesCount = room.unreadMessages?.[user.uid] || 0;
                const lastMessageTimestamp = room.lastMessageTimestamp || { seconds: 0 };

                return {
                  ...room,
                  otherUser,
                  lastMessage,
                  unreadMessagesCount,
                  lastMessageTimestamp,
                } as ChatRoomProps;
              })
            );

            const sortedRooms = resolvedRooms.sort((a, b) => {
              return (b.lastMessageTimestamp?.seconds || 0) - (a.lastMessageTimestamp?.seconds || 0);
            });

            setChatRooms(sortedRooms);
          });

              return () => {
                filterChatRooms();
              };
            }
          });
          return () => {
            filterUser(); // 작업 끝 ~
          };
        }
      };

  useEffect(() => {
    getChatRooms(); 
    getFollowingList();
    
  }, [user?.uid]);

    // 실시간 데이터 업데이트: 사용자가 로그인할 때 새로운 데이터(예: 채팅방, 팔로우 리스트 등)를 가져와야 하니까. 현재 로그인되어있는 사용자 기준으로 실시간 업데이트가 되어야하기 때문에 user?.uid 가 되는 것임 

    // 만약 사용자가 로그아웃하거나 다른 사용자로 로그인하면, 기존에 저장된 데이터는 더 이상 유효하지 않으므로 새로운 사용자에 맞는 데이터를 로드 

   // 팔로잉 리스트
  const getFollowingList = async () => {
    if (user?.uid) {
      const userSnap = await getDoc(doc(db, 'Users', user?.uid))

      if (userSnap.exists()) {
        //있는지 확인하고, 
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
        // console.log(followingUsers)
        setFollowingList(followingUsers as UserProps[]);
      }
    }
  };

const getOtherUserInfo = async (room: ChatRoomProps): Promise<UserProps | null> => {
  if (!user || !room.users) return null;

  const otherUserId = room.users.find(userId => userId !== user.uid);
  // find 메서드는 배열에서 주어진 조건을 만족하는 첫 번째 요소를 찾는 함수. user.uid와 같지 않은 첫 번째 사용자 ID를 반환하기 위해 find 사용함 .
  if (!otherUserId) return null;

  // find 로 찾아놓은 친구 Users 데이터 베이스에서 찾아오기
  const otherUserDocRef = doc(db, 'Users', otherUserId);
  const otherUserSnapshot = await getDoc(otherUserDocRef);

  // 사용자 정보가 존재하면 반환
  return otherUserSnapshot.exists() ? { id: otherUserId, ...otherUserSnapshot.data() } as UserProps : null;
};

  const CloseDialog = () => {
    setOpen(false);
    setSelectedUserId(null);
  };

  const CreateNewChat = () => {
    if (selectedUserId) {
      CreateRoom(selectedUserId);
      CloseDialog();
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
                      alt={`${otherUser.displayName}`}
                      style={{borderRadius: '50%', width: '40px', height: '40px'}}
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ccc' }} />
                  )}
                  <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                    <p style={{ fontWeight: 'bold', color: '#333' }}>{otherUser?.displayName}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>{formatTimestamp(room.lastMessageTimestamp)}</p>
                  </div>
                  <p className='lastmsg'>
                    {room?.lastMessage}
                  </p>
                  </div>
                </div>
                <div style={{ marginRight: '10px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  
                  <p>{unreadMessagesCount > 0 && (
                  <Badge badgeContent={unreadMessagesCount} color='error' />
                )}</p>
                </div>
                    
              </Link>
            );
          })
        )}

        <AppBottomNav />

        <Dialog open={open} onClose={CloseDialog}
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
            <Button fullWidth onClick={CloseDialog} sx={{
              color: '#333',
              height: '40px',
              backgroundColor: '#efefef',
              
            }}>취소</Button>
            <Button fullWidth onClick={CreateNewChat} sx={{
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
