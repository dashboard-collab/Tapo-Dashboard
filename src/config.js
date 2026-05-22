export const CONFIG = {
  // Spreadsheet ID
  spreadsheetId: "1dEbB0LVzPFMpFaiC2--kLx43RLiWZleh0nzCL4MGVtg",
  // List of rooms with their specific colors
  rooms: [
    {
      id: "coldkit_room",
      sheetName: "ColdKit Room",
      color: "#ef4444", // Red
      icon: "❄️"
    },
    {
      id: "coldkit_fridge1",
      sheetName: "ColdKit Fridge 1",
      color: "#38bdf8", // Blue
      icon: "🧊"
    },
    {
      id: "coldkit_fridge2",
      sheetName: "ColdKit Fridge 2",
      color: "#4ade80", // Green
      icon: "🧊"
    },
    {
      id: "meddevice_room",
      sheetName: "MedDevice Room",
      color: "#c084fc", // Purple
      icon: "💊"
    }
  ],
  refreshIntervalMs: 60000, // อัปเดตทุกๆ 1 นาที
};
