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

  return (
    <button
      onClick={handleClick}
      className="
        bg-blue-500 
        text-white 
        px-4 py-2 
        rounded-lg 
        shadow-md 
        hover:bg-blue-600 
        active:bg-blue-700 
        transition 
        duration-150 
        ease-in-out
        focus:outline-none
        focus:ring-2
        focus:ring-blue-400
      "
    >
      最新のチャートを取得
    </button>
  );
};
