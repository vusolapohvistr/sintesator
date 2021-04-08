declare module 'audioconcat' {
  import { Stream } from "node:stream";
  export default function(filePaths: string[]): IConcat;

  interface IConcat {
    concat(filePath: string): Stream;
  }
}