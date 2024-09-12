import PostList from "components/PostList"
import AppBarHeader from "components/Header";
import AppBottomNav from 'components/BottomNavigation';

export default function PostListPage(){
    return(
        <div className="postBOxt" >
            <AppBarHeader />
            <PostList/>
            {/* <AppBottomNav /> */}
        </div>
    )
}