import { Injectable } from "@nestjs/common";
const AdmZip = require("adm-zip");
import axios from "axios";
import { Buffer } from "buffer";
import * as PDFJS from "pdfjs-dist/legacy/build/pdf.mjs";
// import * as PDFJS from "pdfjs-dist";
const sharp = require("sharp");

@Injectable()
export class ImageExtractorService {
  async extractImagesFromDocument(params: { fileType: string; filePath: string }): Promise<Buffer[]> {
    if (params.fileType !== "pdf" && params.fileType !== "docx") return [];

    try {
      const documentData = await this.downloadFileAsBuffer(params.filePath);
      const documentDataString = await this.downloadFileAsUint8Array(params.filePath);

      let images: Buffer[] = [];
      try {
        if (params.fileType === "pdf") {
          images = await this.extractImagesFromPdf(documentDataString);
        } else if (params.fileType === "docx") {
          images = await this.extractImagesFromDocx(documentData);
        } else {
          return [];
        }
      } catch (error) {
        console.error("Error extracting images from document:", error);
        images = [];
      }

      return images;
    } catch (error) {
      console.error(`Error downloading file from ${params.filePath}:`, error);
      return [];
    }
  }

  async extractImagesFromMarkdown(_: { content: string }): Promise<Buffer[]> {
    // TODO IMPLEMENT
    return [];
  }

  private async downloadFileAsBuffer(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  }

  private async downloadFileAsUint8Array(url: string): Promise<Uint8Array> {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return new Uint8Array(response.data);
  }

  private async waitForObject(objs: any, imgName: string, retries = 10, delay = 50): Promise<any> {
    for (let i = 0; i < retries; i++) {
      if (objs.has(imgName)) {
        return objs.get(imgName);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error(`Object ${imgName} was not resolved in time`);
  }

  private async extractImagesFromPdf(pdfData: Uint8Array): Promise<Buffer[]> {
    const images: Buffer[] = [];

    // Configure PDFJS to use a fake worker (no worker needed in Node.js)
    // PDFJS.GlobalWorkerOptions.workerSrc = null;

    const loadingTask = PDFJS.getDocument({ data: pdfData });
    const pdfDocument = await loadingTask.promise;

    const numPages = pdfDocument.numPages;

    const imgs: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);

      const ops = await page.getOperatorList();
      const objs = page.objs;

      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        const args = ops.argsArray[i];

        if (fn === PDFJS.OPS.paintImageXObject) {
          const imgName = args[0];

          if (imgs.includes(imgName)) continue;

          imgs.push(imgName);

          // const imgData = imgName.startsWith("g_") ? page.commonObjs.get(imgName) : objs.get(imgName);

          let imgData;
          if (imgName.startsWith("g_")) {
            imgData = page.commonObjs.get(imgName);
          } else {
            try {
              imgData = await this.waitForObject(objs, imgName);
            } catch (error) {
              console.error(error.message);
              continue;
            }
          }

          if (imgData && imgData.data) {
            const { width, height, data, kind } = imgData;

            if (!width || !height || !data) {
              console.error(`Invalid image data for ${imgName}`);
              continue;
            }

            // Set a default channel count based on the image kind
            let defaultChannels = 3; // Default to RGB
            if (kind === 1) {
              defaultChannels = 1; // Grayscale
            } else if (kind === 2 || kind === 3) {
              defaultChannels = 4; // Assume RGBA or CMYK initially
            }

            const actualSize = data.length;

            // Compute the channel count based on actual data size
            const computedChannels = Math.round(actualSize / (width * height));

            if (
              computedChannels !== defaultChannels &&
              (computedChannels === 1 || computedChannels === 3 || computedChannels === 4)
            ) {
              defaultChannels = computedChannels;
            }

            const expectedSize = width * height * defaultChannels;

            if (actualSize !== expectedSize) {
              console.error(
                `Image size mismatch: expected ${expectedSize} bytes (with ${defaultChannels} channels), got ${actualSize}. Skipping this image.`,
              );
              continue; // Skip problematic images if sizes still don't match
            }

            let sharpImage = sharp(Buffer.from(data), {
              raw: { width, height, channels: defaultChannels },
            });

            // Fix CMYK conversion properly
            if (kind === 3) {
              sharpImage = sharpImage.toColorspace("srgb"); // Fix: Use "srgb" instead of "rgb"
            }

            const pngBuffer = await sharpImage.png().toBuffer();
            images.push(pngBuffer);
          }
        }
      }
    }

    return images;
  }

  private async extractImagesFromDocx(docxData: Buffer): Promise<Buffer[]> {
    const zip = new AdmZip(docxData);
    const images: Buffer[] = [];

    const zipEntries = zip.getEntries();
    for (const zipEntry of zipEntries) {
      if (zipEntry.entryName.startsWith("word/media/")) {
        const imageData = zipEntry.getData();
        images.push(imageData);
      }
    }

    return images;
  }
}
