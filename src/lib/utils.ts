import { executeCode } from "@/code/client-code-executer";
import { type ClassValue, clsx } from "clsx"
import { CommandModel } from "../../shared/models/command.model";
import { twMerge } from "tailwind-merge"
import { VectorApi } from "@/api/vector.api";
import { CodeFunctions } from "@/code/client-code-functions";
export let _hasFiles = false;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function randomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c == "x" ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function setHasFiles(hasFiles) {
  _hasFiles = hasFiles;
}

export function hasFiles() {
  return _hasFiles;
}

export function getConvoId() {
  const split = location.href.split("t?");
  if (split.length == 1) return null;
  const searchParams = location.href.split("t?")[1];
  const url = new URLSearchParams(searchParams);
  const convoId = url.get('convoId');
  return convoId;
}

export function isDisableAutoResize() {
  const split = location.href.split("t?");
  if (split.length == 1) return null;
  const searchParams = location.href.split("t?")[1];
  const url = new URLSearchParams(searchParams);
  const isDisableAutoResize = url.get('disableAutoResize');
  return isDisableAutoResize == "1";
}

export function setCommands(commands: string[]) {


  const url = new URL(location.href);

  if (commands == null || commands.length == 0) {
    url.searchParams.delete('cmd');
  } else {
    url.searchParams.set('cmd', commands.join(","));
  }

  history.replaceState(null, "", url.toString());
}

export function getCommands() {
  const url = new URL(location.href);
  const tasks = url.searchParams.get('cmd');
  return tasks?.split(",").length > 0 ? tasks?.split(",") : [];
}

export function getCommandFromPrompt(str, commandList) {
  const words = str.split(" ");

  const command = commandList.find(o => o.name == words[0]);

  if (command == null) return { command: undefined, prompt: str };

  return { command, prompt: words.slice(1).join(" ") };
}

export function areStringsClose(str1, str2, threshold = 5) {
  const distance = levenshteinDistance(str1, str2);
  return distance <= threshold;
}

function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + (str1[i - 1] === str2[j - 1] ? 0 : 1),
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}

export const placeholderImg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlLXBsdXMiPjxwYXRoIGQ9Ik0yMSAxMnY3YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjVhMiAyIDAgMCAxIDItMmg3Ii8+PGxpbmUgeDE9IjE2IiB4Mj0iMjIiIHkxPSI1IiB5Mj0iNSIvPjxsaW5lIHgxPSIxOSIgeDI9IjE5IiB5MT0iMiIgeTI9IjgiLz48Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMiIvPjxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMi44MjggMEw2IDIxIi8+PC9zdmc+"

export function debounce(func, wait, immediate = false) {
  var timeout;

  return function () {
    var context = this, args = arguments;

    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

export async function saveStateElectron() {
  setTimeout(() => {
    CodeFunctions.execElectron(`saveState()`);
  }, 150);
}

export async function checkAndResizeWindow(height, width = undefined) {
  if (window.innerHeight < 268) {
    await CodeFunctions.execElectron(`resizeWindow(${width},${height})');`);
  }
}

export function adjustWindowHeightToResult() {

  return;
  if (isDisableAutoResize()) return;

  const windowHeight = window.innerHeight;
  const resultHeight = document.getElementById("result-container")?.scrollHeight;
  const minHeight = resultHeight + 70;
  const maxHeight = 600;
  if (minHeight > windowHeight && windowHeight < maxHeight) {
    executeCode(`
      execElectron('resizeWindow(${undefined},${minHeight})');
  `);
  }
}

export function toBase64(buffer: Buffer, ext = "png"): string {
  return `data:image/${ext};base64,${buffer.toString("base64")}`;
}

export function toBuffer(base64: string): Buffer {
  return Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
}


export async function getSimilarity(str1: string, str2: string | string[]): Promise<number> {
  const similarity = await VectorApi.getSimilarity(str1, str2);
  return similarity;
}