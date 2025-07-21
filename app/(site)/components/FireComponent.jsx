"use client";
import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { CloseCircleIcon } from "@sanity/icons";

const FirestoreComponent = () => {
  const [data, setData] = useState({});
  const storageKey = "cee-app-blobs";

  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  const saveToStorage = (newData) => {
    localStorage.setItem(storageKey, JSON.stringify(newData));
  };

  const handleStop = (id, _, dragData) => {
    const { lastX: x, lastY: y } = dragData;
    const relativeX = x / 722;
    const relativeY = y / 722;

    const updatedData = {
      ...data,
      [id]: { ...data[id], x: relativeX, y: relativeY },
    };

    setData(updatedData);
    saveToStorage(updatedData);
  };

  const handleDelete = (id) => {
    const newData = { ...data };
    delete newData[id];
    setData(newData);
    saveToStorage(newData);
  };

  const handleClearAll = () => {
    setData({});
    localStorage.removeItem(storageKey);
  };

  return (
    <div className="overflow-hidden">
      <div
        className="draggable-container aspect-square max-w-full rounded-2xl bg-gray-700"
        style={{ height: "722px", width: "722px", position: "relative" }}
      >
        {Object.keys(data).map((key) => {
          const item = data[key];
          const style = {
            position: "absolute",
            top: `${item.y * 100}%`,
            left: `${item.x * 100}%`,
          };

          return (
            <Draggable
              key={key}
              bounds="parent"
              onStop={(e, dragData) => handleStop(key, e, dragData)}
            >
              <div
                data-id={key}
                className="inline-block cursor-grab rounded-2xl bg-fuchsia-500 px-1 py-px pl-2 active:cursor-grabbing"
                style={style}
              >
                <div className="flex flex-row items-center gap-2">
                  <span>{key}</span>
                  <span
                    className="close-button text-2xl"
                    onClick={() => handleDelete(key)}
                  >
                    <CloseCircleIcon />
                  </span>
                </div>
              </div>
            </Draggable>
          );
        })}
      </div>
      <div className="flex justify-between">
        <button
          className="btn mt-2 rounded-xl bg-green-500/50 px-2 py-1"
          onClick={() => {
            const id = `blob${Object.keys(data).length + 1}`;
            const newData = { ...data, [id]: { id, x: 0, y: 0 } };
            setData(newData);
            saveToStorage(newData);
          }}
        >
          Add blob
        </button>
        <button
          className="btn mt-2 rounded-xl bg-red-500/50 px-2 py-1"
          onClick={handleClearAll}
        >
          Clear All Blobs
        </button>
      </div>
    </div>
  );
};

export default FirestoreComponent;
