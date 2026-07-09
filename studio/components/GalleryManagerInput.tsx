import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { PatchEvent, set, setIfMissing, unset, useClient } from "sanity";

type GalleryImage = {
  _key: string;
  _type: string;
  asset?: { _ref?: string };
  alt?: string;
};

type GalleryInputProps = {
  value?: GalleryImage[];
  onChange: (event: PatchEvent) => void;
  readOnly?: boolean;
  schemaType?: { of?: Array<{ name?: string; type?: string }> };
};

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const cleanFilename = (name: string) => {
  const base = name.replace(/\.[^/.]+$/, "");
  const cleaned = base.replace(/[-_]+/g, " ").trim();
  return cleaned || "Image";
};

const reorder = <T,>(items: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export default function GalleryManagerInput(props: GalleryInputProps) {
  const value = props.value ?? [];
  const readOnly = Boolean(props.readOnly);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const client = useClient({ apiVersion: "2023-10-01" });
  const builder = useMemo(() => imageUrlBuilder(client), [client]);
  const itemTypeName = useMemo(() => {
    const ofEntry = props.schemaType?.of?.[0];
    return ofEntry?.name || ofEntry?.type || "galleryImage";
  }, [props.schemaType]);

  const appendAssets = (assets: Array<{ id: string; alt: string }>) => {
    if (!assets.length) return;
    const nextItems = assets.map((asset) => ({
      _key: newKey(),
      _type: itemTypeName,
      asset: { _type: "reference", _ref: asset.id },
      alt: asset.alt,
    }));
    props.onChange(PatchEvent.from([setIfMissing([], []), set([...value, ...nextItems])]));
  };

  const uploadFiles = async (files: File[]) => {
    if (readOnly) return;
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    setUploading(true);
    try {
      const uploaded: Array<{ id: string; alt: string }> = [];
      for (let i = 0; i < images.length; i += 1) {
        const file = images[i];
        setUploadStatus(`Uploading ${i + 1}/${images.length}: ${file.name}`);
        const asset = await client.assets.upload("image", file, { filename: file.name });
        uploaded.push({ id: asset._id, alt: cleanFilename(file.name) });
      }
      appendAssets(uploaded);
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length) {
      void uploadFiles(files);
    }
    event.target.value = "";
  };

  const removeSelected = () => {
    if (!selected.size || readOnly) return;
    const patches = Array.from(selected).map((key) => unset([{ _key: key }]));
    props.onChange(PatchEvent.from(patches));
    setSelected(new Set());
  };

  const toggleSelected = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onDragStart = (key: string) => setDraggingKey(key);

  const onDropCard = (targetKey: string) => {
    if (!draggingKey || draggingKey === targetKey || readOnly) return;
    const from = value.findIndex((item) => item._key === draggingKey);
    const to = value.findIndex((item) => item._key === targetKey);
    if (from < 0 || to < 0) return;
    props.onChange(PatchEvent.from([setIfMissing([], []), set(reorder(value, from, to))]));
    setDraggingKey(null);
  };

  const onDropZone = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length) {
      void uploadFiles(files);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          {uploading ? uploadStatus : `${value.length} image${value.length === 1 ? "" : "s"}`}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={readOnly || uploading}
          >
            Add Images
          </button>
          <button type="button" onClick={removeSelected} disabled={readOnly || selected.size === 0}>
            Remove Selected
          </button>
        </div>
      </div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDropZone}
        style={{
          border: "1px dashed #555",
          borderRadius: 8,
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
          gap: 12,
          minHeight: 120,
        }}
      >
        {value.map((item) => {
          const thumb = item.asset?._ref
            ? builder.image(item.asset._ref).width(500).height(320).fit("crop").url()
            : "";
          const isSelected = selected.has(item._key);
          return (
            <button
              type="button"
              key={item._key}
              draggable={!readOnly}
              onDragStart={() => onDragStart(item._key)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropCard(item._key)}
              onClick={() => toggleSelected(item._key)}
              style={{
                border: isSelected ? "2px solid #facc15" : "1px solid #666",
                borderRadius: 8,
                overflow: "hidden",
                padding: 0,
                background: "#111",
                color: "#fff",
                textAlign: "left",
                cursor: readOnly ? "default" : "pointer",
              }}
            >
              <div style={{ width: "100%", aspectRatio: "16/10", background: "#222" }}>
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.alt || "Gallery image"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>
              <div style={{ fontSize: 12, padding: "8px 10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.alt || "Gallery image"}
              </div>
            </button>
          );
        })}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
