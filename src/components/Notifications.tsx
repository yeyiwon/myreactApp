import React, { useContext, useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import AuthContext from 'Context/AuthContext';
import AppBarHeader from './LayOut/Header';
import AppBottomNav from './LayOut/BottomNavigation';
import { Avatar, Skeleton } from '@mui/material';
import { formatDate } from './Util/dateUtil';
import { Link } from 'react-router-dom';
import ThemeContext from '../Context/ThemeContext';
import { NotificationType, UserProps } from 'types/InterfaceTypes';

export default function Notification() {
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    // 알림 리스트를 저장하는 상태 
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const { theme } = useContext(ThemeContext);

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
                // 노티 타입 지정해준 배열타입으로 배열로 받을 거라서 

                for (const docSnapshot of snapshot.docs) {
                    const data = docSnapshot.data() as NotificationType;

                    if (data.authorUid) {
                        try {
                            const authorDocRef = doc(db, 'Users', data.authorUid);
                            const authorDoc = await getDoc(authorDocRef);

                            if (authorDoc.exists()) {
                                const authorData = authorDoc.data() as UserProps;
                                notificationsData.push({
                                    ...data,
                                    authorDisplayName: authorData.displayName,
                                    authorProfileUrl: authorData.photoURL,
                                });
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
                setNotifications(notificationsData);
                setLoading(false);

                const unreadNotifications = snapshot.docs.filter(doc => !doc.data().isRead);
                await Promise.all(unreadNotifications.map(async (docSnapshot) => {
                    const docRef = doc(db, 'Notification', docSnapshot.id);
                    await updateDoc(docRef, { isRead: true });
                }));
            });

            return () => unsubscribe();
            // 얘가 필요한 이유는 onsnapshot으로 실시간으로 받는데 
        }
    }, [user]);

    return (
        <div className="NotificationArea" style={{ paddingBottom: '56px' }}>
            <AppBarHeader title="알림" showBackButton={true} />
            <div className="NotificationContent">
                {loading ? (
                    <div className="NotificationList">
                        {Array.from(new Array(5)).map((_, index) => (
                            <li key={index} className="NotificationItemskel">
                                <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="circular" width={40} height={40} />
                                <div className="NotificationText">
                                    <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={200} height={20} />
                                    <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={150} height={20} />
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
