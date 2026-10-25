#include "LzmaDec.h"
#include "Lzma2Dec.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void *allocate(ISzAllocPtr context, size_t size) {
  (void)context;
  return malloc(size);
}
static void release(ISzAllocPtr context, void *pointer) {
  (void)context;
  free(pointer);
}
static const ISzAlloc allocator = { allocate, release };

int main(int argc, char **argv) {
  if (argc != 6) return 2;
  FILE *source = fopen(argv[2], "rb");
  FILE *props_file = fopen(argv[3], "rb");
  if (!source || !props_file || fseek(source, 0, SEEK_END)) return 3;
  const long length = ftell(source);
  if (length < 0 || fseek(source, 0, SEEK_SET)) return 4;
  Byte *input = malloc((size_t)length + 1);
  SizeT read = (SizeT)length;
  SizeT written = (SizeT)strtoull(argv[4], NULL, 10);
  Byte *output = malloc(written + 1);
  Byte properties[5] = { 0 };
  if (!input || !output || fread(input, 1, read, source) != read) return 5;
  const size_t prop_size = fread(properties, 1, sizeof(properties), props_file);
  if (prop_size != (strcmp(argv[1], "lzma") == 0 ? 5u : 1u)) return 6;
  ELzmaStatus status = LZMA_STATUS_NOT_SPECIFIED;
  const SRes result = strcmp(argv[1], "lzma") == 0
    ? LzmaDecode(output, &written, input, &read, properties, 5,
        LZMA_FINISH_END, &status, &allocator)
    : Lzma2Decode(output, &written, input, &read, properties[0],
        LZMA_FINISH_END, &status, &allocator);
  FILE *destination = fopen(argv[5], "wb");
  if (!destination || fwrite(output, 1, written, destination) != written) return 7;
  printf("{\"resultCode\":%d,\"status\":%d,\"bytesRead\":%zu,\"written\":%zu}\n",
    result, (int)status, read, written);
  fclose(source);
  fclose(props_file);
  fclose(destination);
  free(input);
  free(output);
  return 0;
}
