export interface CreateCantonRequest {
  /** INEC canton code (`provinceId * 100 + cantonNumber`), provided by the client. */
  id: number;
  provinceId: number;
  name: string;
}
