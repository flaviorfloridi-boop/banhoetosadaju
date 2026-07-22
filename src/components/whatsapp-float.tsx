const PHONE = "5511944811381";
const MSG = "Olá! Gostaria de agendar um banho e tosa 🐾";

export function WhatsAppFloat() {
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MSG)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white font-semibold shadow-lg hover:scale-105 transition"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5 0-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5H7.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/>
        <path d="M20.5 3.5A10 10 0 0 0 3.9 17.3L2 22l4.9-1.8a10 10 0 0 0 15-13.7c-.4-.9-.9-1.8-1.4-3zM12 20.1c-1.5 0-3-.4-4.3-1.2l-.3-.2-2.9 1 .9-2.8-.2-.3A8.1 8.1 0 1 1 12 20.1z"/>
      </svg>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}