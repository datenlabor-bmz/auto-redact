import type { IHighlight } from "react-pdf-highlighter";

export interface IFGRule {
  reference: string;
  reason: string;
  title: string;
  full_text: string;
  url: string;
  group: string;
}

export interface SecuredactHighlight extends IHighlight {
  ifgRule?: IFGRule;
}
