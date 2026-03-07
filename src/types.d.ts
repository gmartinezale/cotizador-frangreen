import { ReactNode } from "react";

export type ModalData = {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  title?: string;
  link?: string;
  content?: ReactNode | string;
};
