import { nanoid } from "nanoid";

export function messageId(prefix = "msg") {
  return `${prefix}_${nanoid(10)}`;
}
