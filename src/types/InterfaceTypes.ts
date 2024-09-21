// User 인터페이스 정의
export interface UserProps {
  id: string;
  displayName: string;
  email: string;
  following: string[];
  followers: string[];
  photoURL: string;
  chatRooms?: string[];
  visitorMessages?: { message: string; createdAt: Date }[];
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
  otherUser?: UserProps;
  messageCount?: number;
  unreadMessages?: Record<string, number>; // 모든 키는 문자열 넘버 임 
  unreadMessagesCount?: number;
  lastMessageTimestamp?: { seconds: number };
}


export interface NotificationType {
    id: string;
    uid: string; 
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

