/** Unmodified SRes and ELzmaStatus values from the pinned LZMA SDK. */
export interface DecodeResult {
  data: Uint8Array;
  bytesRead: number;
  resultCode: number;
  /** 0 unspecified, 1 finished with marker, 2 not finished, 3 needs input, 4 maybe finished without marker. */
  status: 0 | 1 | 2 | 3 | 4;
}
export interface Decoder {
  decodeLzma(input: Uint8Array, properties: Uint8Array, outputSize: number): DecodeResult;
  decodeLzma2(input: Uint8Array, property: number, outputSize: number): DecodeResult;
}
export interface DecoderOptions {
  wasmBinary?: Uint8Array | ArrayBuffer;
  wasmURL?: URL | string;
}
export function createDecoder(options?: DecoderOptions): Promise<Decoder>;
