import '@testing-library/jest-dom/vitest'

// O jsdom tem o <dialog>, mas ainda não implementa showModal
HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close() {
  this.open = false;
};
