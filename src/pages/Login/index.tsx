
import LoginForm from "components/LoginForm"
import { useNavigate } from 'react-router-dom';
import {IconButton } from '@mui/material';
import { useContext } from "react";

import { TiArrowLeft } from "react-icons/ti";
import ThemeContext, { ThemeContextProvider } from "Context/ThemeContext";

export default function Login(){
    const navigate = useNavigate();
    const { theme } = useContext(ThemeContext);

    const BackClick = () => {
        navigate(-1);
    };


    return(
        <div>
            <div className="title_box">
                <IconButton 
                sx={{ 
                    position: 'absolute',
                    left: 0,
                    
                    color: theme === 'light' ? '#212121' : '#F7F7F7' }}
                    onClick={BackClick}>
                    <TiArrowLeft size={28}/>
                </IconButton>

                <h2> Login </h2>
            </div>

            <div className="FormClass">
                <LoginForm/>
            </div>
        </div>
    )
}