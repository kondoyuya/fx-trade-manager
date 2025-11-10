import { invoke } from "@tauri-apps/api/core";

export const UpdateOHLCButton = () => {
  const handleClick = async () => {
    try {
      const result = await invoke<string>("fetch_and_update_ohlc");
      alert(result);
    } catch (err) {
      console.error(err);
      alert("DB更新に失敗しました");
    }
  };

  return <button onClick={handleClick}>最新のチャートを取得</button>;
};
