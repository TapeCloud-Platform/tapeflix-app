import { AlertDialog, Button } from '@heroui/react';

/** Popup que avisa que el usuario ya tiene una reseña publicada para este título. */
export default function AlreadyReviewedDialog({ isOpen, onClose }) {
  return (
    <AlertDialog.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialog.Backdrop className="modal-backdrop">
        <AlertDialog.Container placement="center">
          <AlertDialog.Dialog className="already-reviewed-dialog" aria-label="Ya dejaste tu reseña">
            <AlertDialog.Header>
              <AlertDialog.Heading>Ya dejaste tu reseña</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              Cada usuario puede publicar una sola reseña por título. Si querés cambiar tu
              opinión, borrá la reseña existente desde la lista y después creá una nueva.
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="primary" onClick={onClose}>
                Entendido
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog.Root>
  );
}
