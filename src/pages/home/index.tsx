import PostList from "components/PostList"
import AppBarHeader from "components/Header";
import AppBottomNav from 'components/BottomNavigation';

export default function Home(){
    return(
        <div>
            <AppBarHeader/>
            <PostList/>
            <AppBottomNav />
        </div>

        

    )
}