import React from 'react';
import { Link } from 'react-router-dom';
import AppBarHeader from './Header';
import AppBottomNav from './BottomNavigation';

interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  profilePicUrl: string;
}

const ChatList: React.FC = () => {
  // 예시 데이터 (실제 데이터는 서버에서 가져오거나 상태 관리 라이브러리 사용)
  const chatRooms: ChatRoom[] = [
    { id: '1', name: 'User 1', lastMessage: 'Hey, how are you?', profilePicUrl: 'https://via.placeholder.com/50' },
    { id: '2', name: 'User 2', lastMessage: 'ㅎ2😍 🍒🍒🍒🍒🍒', profilePicUrl: 'https://via.placeholder.com/50' },
  ];

  return (
    <div style={{ padding: '10px', backgroundColor: 'transparent' }}>
      <AppBarHeader title='Chat' showBackButton={true}/>
      {chatRooms.map(room => (
        <Link key={room.id} to={`/chat/${room.id}`} className='NotificationItem'  style={{ textDecoration: 'none', color: 'black', display: 'flex', alignItems: 'center', padding: '10px', marginBottom: '10px' }}>
          <img src={room.profilePicUrl} alt={`${room.name}'s profile`} style={{ borderRadius: '50%', width: '50px', height: '50px', marginRight: '10px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '400' }}>{room.name}</div>
            <div style={{ color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.lastMessage}</div>
          </div>
        </Link>
      ))}
      <AppBottomNav/>
    </div>
  );
};

export default ChatList;
