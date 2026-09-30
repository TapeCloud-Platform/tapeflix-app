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
              opinión, usá el botón ✏️ de tu reseña en la lista (podés editar una vez cada 30 segundos).
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
