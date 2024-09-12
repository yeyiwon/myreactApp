import { Button } from "@mui/material"
import LoginForm from "components/LoginForm"
import { toast } from "react-toastify"

export default function Login(){
    return(
        <div>
            <div className="title_box">
                <h2> Login </h2>
            </div>
            <div className="FormClass">
                <LoginForm/>
            </div>
        </div>
    )
}