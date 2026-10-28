"use client";

import { useEffect, useRef } from "react";

interface AssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssessmentDialog({ isOpen, onClose }: AssessmentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleClick);

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      id="assessment-dialog"
      className="assessment-dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-copy"
    >
      <div className="dialog-inner">
        <button
          type="button"
          onClick={onClose}
          className="dialog-close"
          aria-label="Close dialog"
        >
          ×
        </button>
        <span className="dialog-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2 3 6v6c0 5 3.4 8 9 10 5.6-2 9-5 9-10V6l-9-4Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </span>
        <p className="eyebrow">PRODUCT PREVIEW</p>
        <h2 id="dialog-title">Security assessments are coming soon.</h2>
        <p id="dialog-copy">
          You&apos;re viewing Secuvora&apos;s landing page. Source-code authorization and
          scanning are not connected yet. No application data has been accessed.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="button button-dark"
        >
          Got it <span aria-hidden="true">↗</span>
        </button>
      </div>
    </dialog>
  );
}
