import fs from "fs";

export const readFile = (path: string) => {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Error reading file from path ${path}:`, error);
    return [];
  }
};

export const writeFile = (path: string, data: any) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file to path ${path}:`, error);
  }
};
