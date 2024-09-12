import PostForm from "components/PostForm"
import AppBarHeader from "components/Header"



export default function PostEdit(){

    return(
        <div className="PostDetail">
            <AppBarHeader title="게시물 수정" showBackButton={true}/>
            <PostForm/>
        </div>
    )
}