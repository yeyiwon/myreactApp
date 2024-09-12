import SignupForm from "components/SignupForm"

export default function Signin(){
    return(
        <div>
            <div className="title_box"> 
                <h2> 회원가입 </h2>
            </div>
            <div className="FormClass">
                <SignupForm/>
            </div>
        </div>


    )
}