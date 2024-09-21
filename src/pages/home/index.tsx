import PostList from "components/Post/PostList"
import AppBarHeader from "components/LayOut/Header";
import AppBottomNav from 'components/LayOut/BottomNavigation';

export default function Home(){
    return(
        <div>
            <AppBarHeader/>
            <PostList/>
            <AppBottomNav />
        </div>

        

    )
}