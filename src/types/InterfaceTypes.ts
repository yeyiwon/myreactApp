// User 인터페이스 정의
export interface UserProps {
  id: string;
  displayName: string;
  email: string;
  following: string[];
  followers: string[];
  photoURL: string;
  chatRooms?: string[];
}

export interface PostProps {
    title: string;
    email: string;
    context: string;
    createAt: string;
    id?: string;
    uid: string;
    imageUrl: string;
    displayName?: string;
    profileUrl?: string;
    photoURL?: string;
    likes?: string[];
    likeCount?: number; 
    comments?: CommentsInterface[]; 
    lastModifyAt: string;
    backgroundColor?: string;
}

export interface PostWithAuthor extends PostProps {
    authorDisplayName?: string;
    authorProfileUrl?: string;
}





export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderProfilePic: string;
  senderName: string;
  lastMessage: string,
  isRead: boolean;
  isCurrentUser?: boolean; 
  timestamp: { seconds: number };
  lastMessageTimestamp?: { seconds: number };

}

export interface ChatRoomProps {
  id: string;
  lastMessage: string;
  users: string[]; // 유저 ID 목록
  photoURL?: string;
  Message: Message[];
  otherUser?: UserProps;  // 상대방 정보 추가
  messageCount?: number;
  unreadMessages?: Record<string, number>;
  unreadMessagesCount?: number;
  lastMessageTimestamp?: { seconds: number };
}


export interface NotificationType {
    id: string;
    uid: string; // 알림을 받을 사용자 
    isRead: boolean;
    createdAt: string;
    url: string;
    content: string;
    authorUid: string; 
    authorDisplayName?: string; 
    authorProfileUrl?: string; 
}


export interface CommentsInterface {
    content: string;
    uid: string;
    email: string;
    createAt: string;
    authorDisplayName: string;
    authorProfileUrl: string;
}

export interface FollowInfo {
    id: string;           
    displayName: string;   
    photoURL: string;   
    email: string;   
}


export interface FollowInfoWithUser {
    follower: FollowInfo;  
    following: FollowInfo;  
}

