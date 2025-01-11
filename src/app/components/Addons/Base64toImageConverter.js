export const base64toFile = (base64File) => {
  const i = base64File.indexOf("base64,");
  const buffer = Buffer.from(base64File.slice(i + 7), "base64");
  const name = `${Math.random().toString(36).slice(-5)}.png`;
  const file = new File({ buffer, name, type: "image/png" });
  // console.log("file", file);
  return file;
};

export function dataURIToBlob(dataURI) {
  dataURI = dataURI.replace(/^data:/, "");

  const type = dataURI.match(/image\/[^;]+/);
  const base64 = dataURI.replace(/^[^,]+,/, "");
  const arrayBuffer = new ArrayBuffer(base64.length);
  const typedArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < base64.length; i++) {
    typedArray[i] = base64.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type });
}

export function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}
