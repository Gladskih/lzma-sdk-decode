#include "LzmaDec.h"
#include "Lzma2Dec.h"
#include <stdint.h>
#include <stdlib.h>

static void *allocate(ISzAllocPtr allocator, size_t size) {
  (void)allocator;
  return malloc(size);
}

static void release(ISzAllocPtr allocator, void *pointer) {
  (void)allocator;
  free(pointer);
}

static const ISzAlloc allocator = { allocate, release };

static void summarize(uint32_t *summary, SizeT read, SizeT written, ELzmaStatus status) {
  summary[0] = (uint32_t)read;
  summary[1] = (uint32_t)written;
  summary[2] = (uint32_t)status;
}

int decode_lzma(const Byte *input, uint32_t input_size, const Byte *properties,
                Byte *output, uint32_t output_size, uint32_t *summary) {
  SizeT read = input_size;
  SizeT written = output_size;
  ELzmaStatus status = LZMA_STATUS_NOT_SPECIFIED;
  const SRes result = LzmaDecode(output, &written, input, &read, properties,
    LZMA_PROPS_SIZE, LZMA_FINISH_END, &status, &allocator);
  summarize(summary, read, written, status);
  return result;
}

int decode_lzma2(const Byte *input, uint32_t input_size, unsigned property,
                 Byte *output, uint32_t output_size, uint32_t *summary) {
  SizeT read = input_size;
  SizeT written = output_size;
  ELzmaStatus status = LZMA_STATUS_NOT_SPECIFIED;
  const SRes result = Lzma2Decode(output, &written, input, &read, (Byte)property,
    LZMA_FINISH_END, &status, &allocator);
  summarize(summary, read, written, status);
  return result;
}
