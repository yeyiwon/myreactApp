import PostForm from "components/PostForm"
import AppBarHeader from "components/Header";

export default function PostNew(){
    return(
        <div className="PostDetail">
            <AppBarHeader title="새 게시물 작성" showBackButton={true} />
            <PostForm/>
        </div>
    )
}