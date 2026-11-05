import type { Chapter } from "../../types";
import { ch01 } from "./ch01";
import { ch02 } from "./ch02";
import { ch03 } from "./ch03";
import { ch04 } from "./ch04";
import { ch05 } from "./ch05";
import { ch06 } from "./ch06";
import { ch07 } from "./ch07";
import { ch08 } from "./ch08";
import { ch09 } from "./ch09";
import { ch10 } from "./ch10";
import { ch11 } from "./ch11";
import { ch12 } from "./ch12";
import { ch13 } from "./ch13";
import { ch14 } from "./ch14";
import { ch15 } from "./ch15";
import { ch16 } from "./ch16";
import { ch17 } from "./ch17";
import { ch18 } from "./ch18";
import { ch19 } from "./ch19";

/** 所有章节，按学习顺序排列 */
export const chapters: Chapter[] = [
  ch01,
  ch02,
  ch03,
  ch04,
  ch05,
  ch06,
  ch07,
  ch08,
  ch09,
  ch10,
  ch11,
  ch12,
  ch13,
  ch14,
  ch15,
  ch16,
  ch17,
  ch18,
  ch19,
];

/** 章节所属的部分（按出现顺序去重） */
export const parts: string[] = Array.from(new Set(chapters.map((c) => c.part)));
