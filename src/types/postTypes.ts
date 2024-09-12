
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

export interface UsersProps {
    uid: string;
    displayName?: string;
    photoURL?: string;
    chatRooms?: string[];
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
}


export interface FollowInfoWithUser {
    follower: FollowInfo;  
    following: FollowInfo;  
}

export interface PostProps {
    id?: string;
    title: string;
    email: string;
    context: string;
    createAt: string;
    uid: string;
    imageUrl: string;
    displayName?: string;
    profileUrl?: string;
    photoURL?: string;
    likes?: string[];
    likeCount?: number;
    backgroundColor?: string; 
    comments?: CommentsInterface[]; 
    lastModifyAt: string;
}

export interface PostWithAuthor extends PostProps {
    authorDisplayName?: string;
    authorProfileUrl?: string;
}
