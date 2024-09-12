import PostDetail from "components/PostDetail"
import AppBarHeader from "components/Header"
import { useContext, useState } from "react"
import AuthContext from "Context/AuthContext"
export default function PostDetailPage(){
    return(
        <div>
            <PostDetail />
        </div>
    )
}