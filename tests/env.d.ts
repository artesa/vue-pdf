declare module "@samples/*.pdf" {
  const pdfurl: string;
  export default pdfurl;
}

declare module "*?url" {
  const url: string;
  export default url;
}