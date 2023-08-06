"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Draggable from "react-draggable";
import { CloseCircleIcon } from "@sanity/icons";

const FirestoreComponent = () => {
  const [data, setData] = useState({});
  const appName = "cee-app-data";

  useEffect(() => {
    const fetchData = async () => {
      const docData = await getDocs(collection(db, appName));
      docData.forEach((doc) => {
        setData((prevState) => ({ ...prevState, [doc.id]: doc.data() }));
      });
    };

    fetchData();
  }, []);

  const handleStop = async (id, _, data) => {
    const { lastX: x, lastY: y } = data;
    const relativeX = x / 722; // replace with dynamic width if needed
    const relativeY = y / 722; // replace with dynamic height if needed

    await updateDoc(doc(db, appName, id), { x: relativeX, y: relativeY });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, appName, id));
    setData((prevState) => {
      const newState = { ...prevState };
      delete newState[id];
      return newState;
    });
  };

  const handleClearAll = async () => {
    const promises = Object.keys(data).map((id) =>
      deleteDoc(doc(db, appName, id)),
    );
    await Promise.all(promises);
    setData({});
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
              onStop={(e, data) => handleStop(key, e, data)}
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
          onClick={async () => {
            const id = `blob${Object.keys(data).length + 1}`;
            const newData = { id, x: 0, y: 0 };
            await setDoc(doc(db, appName, id), newData);
            setData((prevState) => ({ ...prevState, [id]: newData }));
          }}
        >
          Add blob
        </button>
        <button
          className="btn mt-2 rounded-xl bg-red-500/50 px-2  py-1"
          onClick={handleClearAll}
        >
          Clear All Blobs
        </button>
      </div>
    </div>
  );
};

export default FirestoreComponent;
