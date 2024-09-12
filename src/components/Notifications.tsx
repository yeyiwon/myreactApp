import React, { useContext, useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import AuthContext from 'Context/AuthContext';
import AppBarHeader from './Header';
import AppBottomNav from './BottomNavigation';
import { Avatar, Skeleton } from '@mui/material';
import { formatDate } from './dateUtil';
import { Link } from 'react-router-dom';

interface UserData {
    displayName?: string;
    photoURL?: string;
}

interface NotificationType {
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

export default function Notification() {
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const notificationsRef = collection(db, 'Notification');
            const notificationQuery = query(
                notificationsRef,
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(notificationQuery, async (snapshot) => {
                const notificationsData: NotificationType[] = [];

                for (const docSnapshot of snapshot.docs) {
                    const data = docSnapshot.data() as NotificationType;

                    // Fetch author data
                    if (data.authorUid) {
                        try {
                            const authorDocRef = doc(db, 'Users', data.authorUid);
                            const authorDoc = await getDoc(authorDocRef);

                            if (authorDoc.exists()) {
                                const authorData = authorDoc.data() as UserData;
                                notificationsData.push({
                                    ...data,
                                    authorDisplayName: authorData.displayName,
                                    authorProfileUrl: authorData.photoURL,
                                });
                            }
                        } catch (error) {
                            console.error('Error fetching author document:', error);
                        }
                    }
                }
                setNotifications(notificationsData);
                setLoading(false);

                // Update all notifications to read
                const unreadNotifications = snapshot.docs.filter(doc => !doc.data().isRead);
                await Promise.all(unreadNotifications.map(async (docSnapshot) => {
                    const docRef = doc(db, 'Notification', docSnapshot.id);
                    await updateDoc(docRef, { isRead: true });
                }));
            });

            return () => unsubscribe();
        }
    }, [user]);

    return (
        <div className="NotificationArea">
            <AppBarHeader title="알림" showBackButton={true} />
            <div className="NotificationContent">
                {loading ? (
                    <div className="NotificationList">
                        {Array.from(new Array(5)).map((_, index) => (
                            <li key={index} className="NotificationItemskel">
                                <Skeleton variant="circular" width={40} height={40} />
                                <div className="NotificationText">
                                    <Skeleton variant="text" width={200} height={20} />
                                    <Skeleton variant="text" width={150} height={20} />
                                </div>
                            </li>
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <ul className="NotificationList">
                        {notifications.map(notification => (
                            <Link key={notification.id} to={notification.url}>
                                <li className="NotificationItem">
                                    <Avatar 
                                        src={notification.authorProfileUrl} 
                                        alt="User" 
                                        className="NotificationAvatar" 
                                    />
                                    <div className="Noti_Text">
                                        <p>
                                            <strong>{notification.authorDisplayName}</strong> {notification.content}
                                        </p>
                                        <span className="Noti_Time">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                </li>
                            </Link>
                        ))}
                    </ul>
                ) : (
                    <p className="NoNotifications">알림이 없습니다.</p>
                )}
            </div>
            <AppBottomNav />
        </div>
    );
}
