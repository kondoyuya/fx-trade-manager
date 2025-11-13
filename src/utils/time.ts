export const formatHoldingTime = (seconds: number): string => {
  const rounded = Math.round(seconds); // 小数点四捨五入
  const min = Math.floor(rounded / 60);
  const sec = rounded % 60;
  return `${min}分${sec}秒`;
};
