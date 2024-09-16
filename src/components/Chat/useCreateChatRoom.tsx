import { useContext } from 'react';
import { db } from 'firebaseApp';
import AuthContext from 'Context/AuthContext';
import { addDoc, collection, doc, updateDoc, getDocs, arrayUnion } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export function useCreateChatRoom() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // 채팅방 생성 함수
    const handleCreateRoom = async (targetUserId: string) => {
        if (!user?.uid) {
            console.error('사용자 정보가 없습니다.');
            return;
        }

        try {
            const chatRoomsCollection = collection(db, 'ChatRooms');
            const chatRoomsSnapshot = await getDocs(chatRoomsCollection);

            // 이미 존재하는 방이 있는지 확인
            const existingRoom = chatRoomsSnapshot.docs.find(doc => {
                const roomData = doc.data();
                if (roomData?.users) { // corrected from participants to users
                    return roomData.users.includes(user.uid) && roomData.users.includes(targetUserId);
                }
                return false;
            });

            // 방이 이미 있으면 해당 방으로 이동
            if (existingRoom) {
                navigate(`/chat/${existingRoom.id}`);
                return;
            }

            // 새로운 채팅방 생성
            const newChatRoomRef = await addDoc(chatRoomsCollection, {
                users: [user.uid, targetUserId],
                lastMessage: "", 
                unreadMessages: {
                    [user.uid]: 0, // Initial unread messages count for current user
                    [targetUserId]: 0, // Initial unread messages count for target user
                },
            });

            // 채팅방을 생성한 사용자 정보 업데이트
            await updateDoc(doc(db, 'Users', user.uid), {
                chatRooms: arrayUnion(newChatRoomRef.id),
            });

            // 상대방 사용자 정보 업데이트
            await updateDoc(doc(db, 'Users', targetUserId), {
                chatRooms: arrayUnion(newChatRoomRef.id),
            });

            // 방 생성 후 해당 방으로 이동
            navigate(`/chat/${newChatRoomRef.id}`);
        } catch (error) {
            console.error('채팅방 생성 중 오류 발생:', error);
        }
    };

    return { handleCreateRoom };
}
