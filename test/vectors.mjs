export const properties = Uint8Array.of(0x5d, 0, 0, 1, 0);
export const lzma = Uint8Array.of(
  0, 0x22, 0x10, 0x46, 0xcd, 0x69, 0xa5, 0x3c, 0x7f, 0xff, 0xfa, 0x6f, 0xe0, 0);
// LZMA2: dictionary-reset uncompressed chunk of four bytes, then EndOfStream.
// Official SDK DOC/lzma.txt and C/Lzma2Dec.c.
export const lzma2 = Uint8Array.of(1, 0, 3, 0x44, 0x41, 0x54, 0x41, 0);
export const plain = new TextEncoder().encode("DATA");
