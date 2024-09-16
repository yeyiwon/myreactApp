import PostList from "components/Post/PostList"
import AppBarHeader from "components/LayOut/Header";
import AppBottomNav from 'components/LayOut/BottomNavigation';

export default function PostListPage(){
    return(
        <div className="postBOxt" >
            <AppBarHeader />
            <PostList/>
            {/* <AppBottomNav /> */}
        </div>
    )
}