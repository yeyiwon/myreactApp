import React, { useContext, useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
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

    // useEffect(()=>{},[user])현재 로그인한 유저가 있을 때마다 실행
    useEffect(() => {
        if (user) {
            const notificationsRef = collection(db, 'Notification');
            const notificationQuery = query(
                notificationsRef,
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
                // 노티 컬렉션에서 현재 로그인 한 유저가 받은 알림만 내림차순으로 가져오기 
            );
            console.log(notificationQuery)

            const filterNotification = onSnapshot(notificationQuery, async (snapshot) => {
                //snapshot = 실시간으로 변경된 데이터를 가지고 있다는 뜻 onSnapshot(얘를 기준으로, async(snapshot)=>{
                    //실시간으로 받을 값
                    // console.log(snapshot.docs) // 여기선 현재 아이디 기준으로 알림 받은 갯수만 배열로 뜸
                    //snapshot.docs 얘가 모든 정보를 가지고 있다는 뜻
                // })
                const newNotifications: NotificationType[] = [];
                // 뉴 노티를 노티타입 지정해준 배열로 받고 새로운 알림을 받기 위해 초기화 
                for (const filterNotisnap of snapshot.docs) {
                    const data = filterNotisnap.data() as NotificationType;
                    // 또 타입 변환을 반복문 돌리면서 하는거는 snapshot.docs 얘는 현재 배열로가지고있고, ex) 유저가 받은 알림이 4개일 때 4개인 것만 뜸
                    // 타입 변환
                    // 상대방의 정보는 이후에 상대방의 정보가 바뀐 다면 그거 또한 실시간으로 바뀔 수 있어야하기 때문에 id값만 가지고 있어서 알림을 보낸 상대방의 정보를 불러오는 걸 따로 해줘야하는 절차를 진행시켜야함
                    if(data.authorUid){
                        const authorDocRef = doc(db, 'Users', data.authorUid);

                        const getAuthorData = async () => {
                            const authorDoc = await getDoc(authorDocRef);
                            if(authorDoc.exists()){
                                return authorDoc.data() as UserProps;
                                // 상대방의 정보는 UserProps 타입으로 받아오고 상대방의 정보가 있을 때 가져오고 없으면  null 
                            }
                            return null;
                        }

                        const authorData = await getAuthorData();
                        // 상대방 정보가 담겨져있는 거가지고 newNotifications 최종적으로 이친구한테 이름 프사가 보이게 한다 
                        if(authorData) {
                            newNotifications.push({
                                ...data,
                                authorDisplayName: authorData.displayName,
                                authorProfileUrl: authorData.photoURL,
                            })
                        }
                    }
                }

                setNotifications(newNotifications);
                setLoading(false);
                
                // 읽지 않은 알림 처리
                const unreadDocs = snapshot.docs.filter(doc => !doc.data().isRead);
                // 읽지 않은 거만 필터링 해서 
                if (unreadDocs.length > 0) {
                    // unreadDocs 안 읽은 거만 뽑아낸 거의 길이가 0 보다 클 때 [user] 가 있을 때 읽음으로 처리 
                    const batch = writeBatch(db);
                    unreadDocs.forEach(doc => { // 읽지 않은 메세지 사악 돌고
                        // useEffect의 특성을 살려  [user]) 이거가 이 페이지에 들어왔다면  batch.update(doc.ref, { isRead: true }); 업데이트하는거고
                        batch.update(doc.ref, { isRead: true });
                    });
                    await batch.commit();
                    //writeBatch 얘는 커밋을 해야한다고 함 일괄처리의 특성때무넹 

                    // 배치 업데이트는 여러 개의 쓰기 작업을 한 번에 묶어서 처리할 수 있는 기능인데, 커밋을 호출해야만 그 작업들이 실제로 실행된다. 커밋하지 않으면 메모리에서만 처리되고 데이터베이스에는 아무 변화가 생기지 않는다고 함. 
                }
            });

            return () => filterNotification();
            // 언마운트 해제의 기능인데 더 이상 변화가 없을 때는 조용히 자고 있어 할 일 없을 땐 걍 자
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
