import { invoke } from "@tauri-apps/api/core";

export const UpdateOHLCButton = () => {
  const handleClick = async () => {
    try {
      await invoke<string>("fetch_and_update_ohlc");
      alert("更新に成功しました");
    } catch (err) {
      console.error(err);

      let msg = "不明なエラー";
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === "string") {
        msg = err;
      } else {
        msg = JSON.stringify(err);
      }

      alert("DB更新に失敗しました: " + msg);
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
