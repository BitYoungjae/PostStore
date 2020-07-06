import type { Node } from 'unist';

export interface rehypeNode extends Node {
  tagName: string;
  properties: {
    className?: string[];
    [key: string]: string[] | undefined;
  };
  children?: (Node & { value: string })[];
}

export interface rehypeImageNode extends rehypeNode {
  tagName: 'img';
  properties: rehypeNode['properties'] & {
    src: string;
    alt?: string;
  };
}

export interface rehypeLinkNode extends rehypeNode {
  tagName: 'a';
  properties: rehypeNode['properties'] & {
    href: string;
    alt?: string;
  };
}
