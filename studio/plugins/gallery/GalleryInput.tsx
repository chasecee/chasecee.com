import { useRef, useState, type ChangeEvent } from "react";
import { ImagesIcon } from "@sanity/icons/Images";
import { Button, Grid } from "@sanity/ui";
import {
  type ArrayInputFunctionsProps,
  type ArrayOfObjectsInputProps,
  type ImageValue,
  useClient,
} from "sanity";

export type GalleryImage = ImageValue & { _key: string; alt?: string };

export type AltFromFilename = (filename: string) => string;

export interface GalleryInputOptions {
  accept?: string;
  altFromFilename?: AltFromFilename;
}

const defaultNewKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const defaultAltFromFilename: AltFromFilename = (name) => {
  const base = name.replace(/\.[^/.]+$/, "");
  return base.replace(/[-_]+/g, " ").trim() || "Image";
};

export const createGalleryInput = (options: GalleryInputOptions = {}) => {
  const accept = options.accept ?? "image/*";
  const altFromFilename = options.altFromFilename ?? defaultAltFromFilename;

  function GalleryArrayFunctions(
    props: ArrayInputFunctionsProps<
      GalleryImage,
      ArrayOfObjectsInputProps["schemaType"]
    >,
  ) {
    const { readOnly, schemaType, onItemAppend } = props;
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState("");
    const client = useClient({ apiVersion: "2023-10-01" });
    const itemType = schemaType.of[0];

    const uploadFiles = async (files: File[]) => {
      if (readOnly || !itemType) return;
      const images = files.filter((file) => file.type.startsWith("image/"));
      if (!images.length) return;

      setUploading(true);
      try {
        for (let i = 0; i < images.length; i += 1) {
          const file = images[i];
          setStatus(`Uploading ${i + 1}/${images.length}`);
          const asset = await client.assets.upload("image", file, { filename: file.name });
          onItemAppend({
            _key: defaultNewKey(),
            _type: itemType.name,
            asset: { _type: "reference", _ref: asset._id },
            alt: altFromFilename(file.name),
          });
        }
      } finally {
        setUploading(false);
        setStatus("");
      }
    };

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length) void uploadFiles(files);
      event.target.value = "";
    };

    if (readOnly) return null;

    return (
      <Grid gap={1} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" }}>
        <Button
          icon={ImagesIcon}
          mode="ghost"
          padding={3}
          fontSize={1}
          text={uploading ? status : "Upload images"}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={onFileChange}
          hidden
        />
      </Grid>
    );
  }

  return function GalleryInput(props: ArrayOfObjectsInputProps<GalleryImage>) {
    return props.renderDefault({
      ...props,
      arrayFunctions: GalleryArrayFunctions,
    });
  };
};
