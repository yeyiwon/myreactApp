import React, { useState, useEffect, useContext } from "react";
import AppBottomNav from "./BottomNavigation";
import { BiSearch } from "react-icons/bi";
import { Avatar, Divider, InputAdornment, TextField } from "@mui/material";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "firebaseApp";
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from "Context/AuthContext";

interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
}

export default function Search() {
    const [searchText, setSearchText] = useState<string>("");
    const [results, setResults] = useState<User[]>([]);
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
            const users: User[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as User;
                users.push({ ...data, id: doc.id });
            });
            setResults(users);
        });

        return () => unsubscribe();
    }, [searchText]);

    return (
        <div style={{ paddingBottom: '56px' }}>
            <div className="searchInput">
                    <TextField
                    type="search"
                        placeholder="유저 검색"
                        value={searchText}
                        className="Searchinputarea"
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: (
                            <InputAdornment position="start">
                                <BiSearch size={18}/>
                            </InputAdornment>
                            ),
                        }}
                        fullWidth
                        />

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
