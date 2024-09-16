import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Home from 'pages/home';
import PostListPage from 'pages/Posts';
import PostDetail from 'pages/Posts/detail';
import PostNew from 'pages/Posts/new';
import PostEdit from 'pages/Posts/edit';
import Profile from 'pages/Profile';
import Login from 'pages/Login';
import Signin from 'pages/SignIn';
import ProfileEdit from 'pages/Profile/edit';
import UserProfile from './UserProfile';
import FollowingList from './myfollowingList';
import Search from './Search';
import Notification from './Notifications';
import ChatRoom from './Chat/ChatRoom';
import ChatList from './Chat/ChatList';
import UserFollowingList from './UserFollowingList';
import MainPage from './MainPage';

interface RouterProps {
    isAuthenticated: boolean;
}
// 로그인 여부 확인 프롭스 받는 것임 

const Router: React.FC<RouterProps> = ({ isAuthenticated }) => {
    const handleSelectRoom = (id: string) => {
  // 채팅방 선택 시의 로직을 구현해
};
    
    
    return (
        <Routes>
            {isAuthenticated ? (
                // 로그인이 true라면 여기 
                <>
                    <Route path="/" element={<Home />} />
                    <Route path="/Posts" element={<PostListPage />} />
                    <Route path="/Posts/:id" element={<PostDetail />} />
                    <Route path='/Search' element={<Search/> }/>
                    <Route path="/Posts/new" element={<PostNew />} />
                    <Route path="/Posts/edit/:id" element={<PostEdit />} />
                    
                    <Route path="/Profile" element={<Profile />} />
                    <Route path="/myFollowingList" element={<FollowingList/>}/>
                    <Route path="/userFollowingList/:id" element={<UserFollowingList/>}/>
                    <Route path="/Profile/edit" element={<ProfileEdit />} />

                    <Route path="/user/:id" element={<UserProfile />} />

                    <Route path="/Notification" element={<Notification/>} />
                    <Route path="/chat/:roomId" element={<ChatRoom/>} />

                    <Route path="/chatlist" element={<ChatList />} />


                    <Route path="*" element={<Navigate replace to="/" />} />
                </>
            ) : (
                <>
                    <Route path='/MainPage' element={<MainPage/>}/>
                    <Route path="/Login" element={<Login />} />
                    <Route path="/Signup" element={<Signin />} />
                    <Route path="*" element={<Navigate replace to="/MainPage" />} />
                </>
            )}
        </Routes>
    );
};

export default Router;
