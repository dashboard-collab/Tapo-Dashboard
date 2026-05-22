export const CONFIG = {
  // Spreadsheet ID
  spreadsheetId: "1dEbB0LVzPFMpFaiC2--kLx43RLiWZleh0nzCL4MGVtg",
  // List of rooms with their specific colors
  rooms: [
    {
      id: "coldkit_room",
      sheetName: "ColdKit Room",
      color: "#ef4444", // Red
      icon: "❄️",
      tempRange: [20, 30], // [Min, Max]
      humRange: [40, 70]
    },
    {
      id: "meddevice_room",
      sheetName: "MedDevice Room",
      color: "#c084fc", // Purple
      icon: "💊",
      tempRange: [20, 30],
      humRange: [40, 70]
    },
    {
      id: "coldkit_fridge1",
      sheetName: "ColdKit Fridge 1",
      color: "#38bdf8", // Blue
      icon: "🧊",
      tempRange: [2, 8],
      humRange: [40, 80]
    },
    {
      id: "coldkit_fridge2",
      sheetName: "ColdKit Fridge 2",
      color: "#4ade80", // Green
      icon: "🧊",
      tempRange: [2, 8],
      humRange: [40, 80]
    }
  ],
  refreshIntervalMs: 60000, // อัปเดตทุกๆ 1 นาที
};
