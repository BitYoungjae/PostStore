export interface Path {
  params: {
    [paramName: string]: string | string[];
  };
}

export interface PathList {
  post: Path[];
  category: Path[];
  tag: Path[];
  page: Path[];
}
