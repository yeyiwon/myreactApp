
import { formatDistanceToNow, parseISO, format, differenceInSeconds, differenceInDays } from 'date-fns';

// date-fns 라이브러리에서 시간과 날짜를 다루는 유틸리티 함수들
// formatDistanceToNow: 현재 시간과 주어진 시간의 차이를 사람이 이해하기 쉬운 방식으로 반환해줌
// parseISO: ISO 8601 형식의 날짜 문자열을 Date 객체로 변환.
// format: 주어진 날짜를 지정된 형식으로 출력.
// differenceInSeconds, differenceInDays: 두 날짜 사이의 초 차이와 일 차이를 계산.

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
