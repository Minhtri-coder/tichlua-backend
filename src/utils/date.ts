import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export const VN_TIMEZONE = "Asia/Ho_Chi_Minh";


// Tạo instance dayjs neo theo giờ VN
export const dayjsVN = (date?: string | number | Date) => {
    return dayjs(date).tz(VN_TIMEZONE)
}
// Lấy start và end của 1 ngày cụ thể (YYYY-MM-DD)
export const getDayRangeVN = (dateStr: string) => {
    const d = dayjs.tz(dateStr, VN_TIMEZONE);
    return {
        startOfDay: d.startOf("day").toDate(),
        endOfDay: d.endOf("day").toDate()
    }
};

// Lấy start và end của tháng cụ thể

export const getMonthRangeVN = (year: number, month: number) => {
    const d = dayjs.tz(`${year}-${String(month).padStart(2, "0")}-01`, VN_TIMEZONE);

    return {
        startOfMonth: d.startOf("month").toDate(),
        endOfMonth: d.endOf("month").toDate(),
    };
};
