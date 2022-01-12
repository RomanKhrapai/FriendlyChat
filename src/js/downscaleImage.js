
export function downscaleImage(dataUrl,newHeight, imageType, imageArguments) {
    newHeight = newHeight || 100;
  
   imageType = imageType || "image/jpeg";
   imageArguments = imageArguments || 0.7;
 
    const image = new Image();
   image.src = dataUrl;
   const newWidth = Math.floor(image.width / image.height * newHeight);
   const canvas = document.createElement("canvas");
   canvas.width = newWidth;
   canvas.height = newHeight;
   const ctx = canvas.getContext("2d");
   ctx.drawImage(image, 0, 0, newWidth, newHeight);
   console.log(canvas);
  return canvas.toDataURL(imageType, imageArguments); 
 }   