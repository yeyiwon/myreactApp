import PostForm from "components/Post/PostForm"
import AppBarHeader from "components/LayOut/Header"



export default function PostEdit(){

    return(
        <div className="PostDetail">
            <AppBarHeader title="게시물 수정" showBackButton={true}/>
            <PostForm/>
        </div>
    )
}