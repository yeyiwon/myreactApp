import React from 'react';
import { Link } from 'react-router-dom';
import Spline from '@splinetool/react-spline';

export default function MainPage(){
    return(
        
        <div className='mainPage' 
        style={{ 
                backgroundImage: "url('/images/backgroundimg.png')", 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', }} >

        <h1 className='mainpagetitle'> 👋🏻 My SNS </h1>


        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: "15px" }}>
            <Link to='/Login' >
                <button className='mainPageBTN' style={{ background: "#580EF6", color: "#F7F7F7" }} > 로그인 </button>
            </Link>
            <Link to='/Signup' >
                <button className='mainPageBTN'style={{ background: "#F7F7F7", color: "#580EF6" }}  > 회원가입 </button>
            </Link>
        </div>
        </div>
    )
} 
