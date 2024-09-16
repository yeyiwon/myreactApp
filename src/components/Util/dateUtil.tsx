
import { formatDistanceToNow, parseISO, format, differenceInSeconds, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale'; 

export const formatDate = (dateString: string) => {
    try {
        const date = parseISO(dateString);
        const secondsDifference = differenceInSeconds(new Date(), date);
        const daysDifference = differenceInDays(new Date(), date);

        if (secondsDifference < 60) {
            return `${secondsDifference}초 전`;
        } else if (secondsDifference < 3600) { 
            return `${Math.floor(secondsDifference / 60)}분 전`;
        } else if (daysDifference < 1) {
            return formatDistanceToNow(date, { addSuffix: true, locale: ko });
        } else {
            return format(date, 'yyyy년 MM월 dd일', { locale: ko });
        }
    } catch (error) {
        console.error('날짜 포맷 오류:', error);
        return '날짜 정보 없음';
    }
};
