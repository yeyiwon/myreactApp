import React, { useState, useEffect, useContext } from "react";
import AppBottomNav from "./LayOut/BottomNavigation";
import { BiSearch } from "react-icons/bi";
import { Avatar, Divider, InputAdornment, TextField } from "@mui/material";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "firebaseApp";
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from "Context/AuthContext";
import { UserProps } from "types/InterfaceTypes";

export default function Search() {
    const [searchText, setSearchText] = useState<string>("");
    const [results, setResults] = useState<UserProps[]>([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        // searchText 의 변화가 이을 때마다 
        if (searchText.trim() === "") {
            setResults([]);
            return;
        }

        const usersSearch = collection(db, "Users");
        
        const emailQuery = query(
            usersSearch,
            //email 가 searchText가 시작하는 값 toLowerCase() 대소문자구문 x
            where("email", ">=", searchText.toLowerCase()),
            where("email", "<=", searchText.toLowerCase() + "\uf8ff")
        );

        const displayNameQuery = query(
            usersSearch,
            where("displayName", ">=", searchText.toLowerCase()),
            where("displayName", "<=", searchText.toLowerCase() + "\uf8ff")
        );

        // 사용자 검색 결과를 저장할 배열 배열로 받는 건 내가 이름과 이메일 둘다 검색 가능하게 해두어서 그럼 
        const allUsers: UserProps[] = [];
        // 빈 배열 만들어 두는 건 그냥 코딩의 기본이니 외우자 useState 초기값 설정하는거랑 같은 의미

        const filterEmail = onSnapshot(emailQuery, (emailSnapshot) => {
            // 실시간으로 emailQuery 변경값을 가지면서 emailSnapshot 에 담고
            // console.log(emailSnapshot.docs) // 엄청나게 많은 게 출력됨 얘를 타입 지정해서 가져올 필요가 있다
            // 담긴 값으로 반복문을 도는 것임 
            emailSnapshot.forEach((UserDoc) => {
                const data = UserDoc.data() as UserProps;
                allUsers.push({ ...data, id: UserDoc.id });
            });
            setResults(allUsers);
            // 검색 결과 보여주기
        });

        const filterDisplayName = onSnapshot(displayNameQuery, (diplayNameSnapshot) => {
            diplayNameSnapshot.forEach((UserDoc) => {
                const data = UserDoc.data() as UserProps;
                
                if (!allUsers.find(user => user.id === UserDoc.id)) { 
                    allUsers.push({ ...data, id: UserDoc.id });
                }
            });
            setResults(allUsers);
        });

        return () => {
            filterEmail();
            filterDisplayName();
        };
    }, [searchText]);

    return (
        <div style={{ paddingBottom: '56px' }}>
            <div style={{ padding: '1em'}}>
            <div className="searchInput">
                <BiSearch size={20}/>
                    <input
                    type="search"
                        placeholder="유저 검색"
                        value={searchText}
                        className="Searchinputarea"
                        onChange={(e) => setSearchText(e.target.value)}
                        />

            </div>
            </div>

            <div className="Searchresults">
                <p className="SearchAreaTitle"> 검색 결과</p>
                {results.length > 0 ? (
                    <ul className="SearchArea">
                        {results.map((userResult) => (
                            <Link 
                                key={userResult.id} 
                                to={user?.uid === userResult.id ? `/Profile` : `/user/${userResult.id}`}
                            >
                                <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <Avatar
                                        sx={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        src={userResult.photoURL}
                                    />
                                    <div>
                                        <span className="Comment_Author">{userResult.displayName}</span>
                                        <p className="Comment_Text"> {userResult.email} </p>
                                    </div>
                                </li>
                            </Link>
                        ))}
                    </ul>
                ) : (
                    <p className="noPostlist">검색 결과가 없습니다.</p>
                )}
            </div>

            <AppBottomNav />
        </div>
    );
}
