import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ImportFromJsonDialog } from "./ImportFromJsonDialog";
export const ImportFromJsonButton = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setModalOpen(open);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenModal}
        className="flex items-center gap-2 cursor-pointer"
      >
        <HugeiconsIcon icon={Upload01Icon} /> Import JSON file
      </Button>
      <ImportFromJsonDialog open={modalOpen} onOpenChange={handleCloseModal} />
    </>
  );
};
