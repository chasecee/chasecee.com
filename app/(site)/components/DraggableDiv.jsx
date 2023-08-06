import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag, useDrop } from "react-dnd";

const type = "box"; // Need to be the same for the drop and drag component

const style = {
  border: "1px solid gray",
  backgroundColor: "white",
  padding: "0.5rem 1rem",
  marginRight: "1.5rem",
  marginBottom: "1.5rem",
  cursor: "move",
  float: "left",
};

const Box = () => {
  const [{ isDragging }, drag] = useDrag({
    type,
    item: { name: "Any custom data" },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        console.log(`You dropped ${item.name} into ${dropResult.name}!`);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  return (
    <div ref={drag} style={{ ...style, opacity: isDragging ? 0.5 : 1 }}>
      Drag me
    </div>
  );
};

const Area = () => {
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: type,
    drop: () => ({ name: "This is a drop area" }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });
  const isActive = canDrop && isOver;
  return (
    <div
      ref={drop}
      style={{ ...style, backgroundColor: isActive ? "red" : "white" }}
    >
      {isActive ? "Release to drop" : "Drag box here"}
    </div>
  );
};

export default function DnDTest() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <Box />
        <Area />
      </div>
    </DndProvider>
  );
}
