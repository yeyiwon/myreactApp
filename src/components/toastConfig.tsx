import { Slide, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const toastStyle = {
    fontSize: '14px',
    borderRadius: '8px',
    fontWeight: '500',
    // padding: '0.7em',
    margin: '10px 0',

    whiteSpace: 'nowrap' 
};

const getToastStyle = (theme: string) => ({
    ...toastStyle,
    background: theme === 'light' ? '#F7F7F7' : '#1A1C22',
    color: theme === 'light' ? '#1A1C22' : '#F7F7F7',
});


export const SuccessToast = (message: string, theme: string) => {
    toast.success(message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        closeButton: false,
        progress: undefined,
        style: getToastStyle(theme),
        transition: Slide,
    });
};

export const ErrorToast = (message: string, theme: string) => {
    toast.error(message, {
        position: "top-center",
        autoClose: 2000,
        
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        closeButton: false,
        progress: undefined,
        style: getToastStyle(theme),
        transition: Slide,
    });
};
