// The web preview uses localStorage (SQLite on web needs cross-origin isolation headers).
export const kv = {
  getItemSync: (key: string) => localStorage.getItem(key),
  setItemSync: (key: string, value: string) => localStorage.setItem(key, value),
  removeItemSync: (key: string) => {
    localStorage.removeItem(key);
    return true;
  },
  getAllKeysSync: () => Object.keys(localStorage),
};
