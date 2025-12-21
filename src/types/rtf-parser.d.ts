declare module 'rtf-parser' {
  export function string(rtfString: string): Promise<any>;
  export function stream(callback: (err: Error | null, doc: any) => void): NodeJS.WritableStream;
}
