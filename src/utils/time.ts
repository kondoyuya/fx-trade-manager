export const formatHoldingTime = (seconds: number): string => {
  const rounded = Math.round(seconds); // 小数点四捨五入
  const min = Math.floor(rounded / 60);
  const sec = rounded % 60;
  return `${min}分${sec}秒`;
};

export const parseTimeToSeconds = (timeStr: string) => {
  const parts = timeStr.split(":").map(Number);
  if (parts.length !== 3) return 0;
  const [hh, mm, ss] = parts;
  return hh * 3600 + mm * 60 + ss;
};

export const getStartOfYearString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  return `${yyyy}-01-01`;
};

export const getStartOfMonthString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
};

export const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
