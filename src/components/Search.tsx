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
        if (searchText.trim() === "") {
            setResults([]);
            return;
        }

        const usersRef = collection(db, "Users");
        const q = query(
            usersRef,
            where("email", ">=", searchText.toLowerCase()),
            where("email", "<=", searchText.toLowerCase() + "\uf8ff")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const users: UserProps[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as UserProps;
                users.push({ ...data, id: doc.id });
            });
            setResults(users);
        });

        return () => unsubscribe();
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
