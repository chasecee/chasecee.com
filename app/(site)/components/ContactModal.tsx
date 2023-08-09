import React, { useState } from "react";
import Modal from "react-modal";
import { Form } from "./Form"; // Assuming Form is in the same directory

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export const ContactModal = () => {
  //   const [isModalOpen, setIsModalOpen] = useState(false);

  //   const handleOpenModal = () => {
  //     setIsModalOpen(true);
  //   };

  //   const handleCloseModal = () => {
  //     setIsModalOpen(false);
  //   };

  return (
    <Dialog>
      <DialogTrigger>Contact</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure absolutely sure?</DialogTitle>
          <DialogDescription>
            <Form />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
