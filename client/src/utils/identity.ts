export const getUsername = (): string => {
  const stored = localStorage.getItem('username');
  if (stored) return stored;
  const name =
    (window.prompt('Enter your username') || '').trim() ||
    `User-${Math.floor(Math.random() * 1000)}`;
  localStorage.setItem('username', name);
  return name;
};
